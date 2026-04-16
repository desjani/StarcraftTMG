package com.scadjutant.android.data

import android.app.Activity
import android.content.Context
import androidx.credentials.ClearCredentialStateRequest
import androidx.credentials.CredentialManager
import androidx.credentials.CustomCredential
import androidx.credentials.GetCredentialRequest
import androidx.credentials.exceptions.GetCredentialException
import androidx.credentials.exceptions.NoCredentialException
import com.google.android.libraries.identity.googleid.GetGoogleIdOption
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential
import com.google.android.libraries.identity.googleid.GoogleIdTokenParsingException
import com.google.firebase.FirebaseApp
import com.google.firebase.FirebaseOptions
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.GoogleAuthProvider
import com.google.firebase.auth.FirebaseUser
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.SetOptions
import com.scadjutant.android.BuildConfig
import com.scadjutant.android.domain.CloudMerge
import com.scadjutant.android.model.FavoriteSeed
import com.scadjutant.android.model.LocalGameLibrary
import com.scadjutant.android.model.LocalPlayState
import com.scadjutant.android.model.ParsedRoster
import com.scadjutant.android.model.PlayHealthPool
import com.scadjutant.android.model.PlayUnitTracker
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.tasks.await
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonNull
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.Json

data class CloudSnapshot(
    val recentSeeds: List<String>,
    val favorites: List<FavoriteSeed>,
    val gameLibrary: LocalGameLibrary,
)

data class LinkedMatchSession(
    val matchId: String,
    val side: String,
)

data class LinkedMatchState(
    val matchId: String,
    val participants: Map<String, String?> = emptyMap(),
    val sharedState: Map<String, Any?> = emptyMap(),
)

data class LinkedSideState(
    val side: String,
    val name: String,
    val seed: String,
    val faction: String,
    val score: Int,
    val resource: Int,
    val activationRound: Int,
    val roster: ParsedRoster?,
    val unitsByKey: Map<String, PlayUnitTracker>,
)

data class LinkedMatchPayload(
    val match: LinkedMatchState,
    val playerSide: LinkedSideState,
    val opponentSide: LinkedSideState,
)

class CloudSyncRepository(context: Context) {
    private val appContext = context.applicationContext
    private val json = Json { ignoreUnknownKeys = true }
    private val app: FirebaseApp by lazy { ensureFirebaseApp() }
    private val auth: FirebaseAuth by lazy { FirebaseAuth.getInstance(app) }
    private val db: FirebaseFirestore by lazy { FirebaseFirestore.getInstance(app) }
    private val credentialManager: CredentialManager by lazy { CredentialManager.create(appContext) }

    fun authState(): Flow<FirebaseUser?> = callbackFlow {
        val listener = FirebaseAuth.AuthStateListener { firebaseAuth ->
            trySend(firebaseAuth.currentUser)
        }
        auth.addAuthStateListener(listener)
        trySend(auth.currentUser)
        awaitClose { auth.removeAuthStateListener(listener) }
    }

    suspend fun signInAnonymously(): FirebaseUser {
        return auth.signInAnonymously().await().user ?: error("Anonymous sign-in failed.")
    }

    fun isGoogleSignInConfigured(): Boolean = BuildConfig.GOOGLE_WEB_CLIENT_ID.isNotBlank()

    suspend fun signInWithGoogle(activity: Activity): FirebaseUser {
        val serverClientId = BuildConfig.GOOGLE_WEB_CLIENT_ID.trim()
        require(serverClientId.isNotBlank()) {
            "Google sign-in is not configured yet. Add SCADJUTANT_GOOGLE_WEB_CLIENT_ID to android/local.properties."
        }

        val googleIdToken = requestGoogleIdToken(activity, serverClientId)
        val credential = GoogleAuthProvider.getCredential(googleIdToken, null)
        val currentUser = auth.currentUser

        return when {
            currentUser?.isAnonymous == true -> {
                runCatching {
                    currentUser.linkWithCredential(credential).await().user
                }.getOrNull()
                    ?: auth.signInWithCredential(credential).await().user
                    ?: error("Google sign-in failed.")
            }
            else -> auth.signInWithCredential(credential).await().user ?: error("Google sign-in failed.")
        }
    }

    suspend fun signOut() {
        auth.signOut()
        runCatching {
            credentialManager.clearCredentialState(ClearCredentialStateRequest())
        }
    }

    suspend fun createLinkedMatch(game: LocalPlayState, hostSide: String = "player"): LinkedMatchSession {
        val uid = auth.currentUser?.uid ?: error("You must be signed in for linked play.")
        require(game.isLinkedGame || game.hasStarted) { "A started game is required for linked play." }

        val normalizedHostSide = normalizeLinkedSide(hostSide)
        var matchId = ""
        repeat(8) {
            if (matchId.isNotBlank()) return@repeat
            val candidate = generateLinkedMatchCode()
            val existing = db.collection("linkedMatches").document(candidate).get().await()
            if (!existing.exists()) matchId = candidate
        }
        if (matchId.isBlank()) error("Unable to allocate a linked game code. Try again.")

        val participants = mapOf(
            "playerUid" to if (normalizedHostSide == "player") uid else null,
            "opponentUid" to if (normalizedHostSide == "opponent") uid else null,
        )
        val createdAt = nowIso()

        db.collection("linkedMatches").document(matchId).set(
            mapOf(
                "matchId" to matchId,
                "ownerUid" to uid,
                "status" to "active",
                "createdAt" to createdAt,
                "updatedAt" to createdAt,
                "participants" to participants,
                "sharedState" to buildLinkedSharedState(game),
                "schemaVersion" to 1,
            )
        ).await()

        updateLinkedMatchSideState(matchId, normalizedHostSide, game)
        return LinkedMatchSession(matchId = matchId, side = normalizedHostSide)
    }

    suspend fun joinLinkedMatch(matchId: String, preferredSide: String? = null): LinkedMatchSession {
        val uid = auth.currentUser?.uid ?: error("You must be signed in for linked play.")
        val normalizedMatchId = normalizeLinkedCode(matchId)
        require(normalizedMatchId.isNotBlank()) { "Match code is required." }
        val normalizedPreferred = preferredSide?.let(::normalizeLinkedSide)
        val matchRef = db.collection("linkedMatches").document(normalizedMatchId)

        val resolvedSide = db.runTransaction { txn ->
            val snapshot = txn.get(matchRef)
            if (!snapshot.exists()) error("Linked game not found.")
            val data = snapshot.data.orEmpty()
            val participants = data["participants"] as? Map<*, *> ?: emptyMap<String, String?>()
            val playerUid = participants["playerUid"]?.toString()
            val opponentUid = participants["opponentUid"]?.toString()

            if (playerUid == uid) return@runTransaction "player"
            if (opponentUid == uid) return@runTransaction "opponent"

            val playerOpen = playerUid.isNullOrBlank()
            val opponentOpen = opponentUid.isNullOrBlank()

            val assignedSide = when {
                normalizedPreferred == "player" && playerOpen -> "player"
                normalizedPreferred == "opponent" && opponentOpen -> "opponent"
                playerOpen -> "player"
                opponentOpen -> "opponent"
                else -> error("Linked game already has two players.")
            }

            val nextParticipants = mapOf(
                "playerUid" to if (assignedSide == "player") uid else playerUid,
                "opponentUid" to if (assignedSide == "opponent") uid else opponentUid,
            )

            txn.set(
                matchRef,
                mapOf(
                    "participants" to nextParticipants,
                    "updatedAt" to nowIso(),
                ),
                SetOptions.merge(),
            )

            txn.set(
                matchRef.collection("sides").document(assignedSide),
                mapOf(
                    "uid" to uid,
                    "updatedAt" to nowIso(),
                ),
                SetOptions.merge(),
            )

            assignedSide
        }.await()

        return LinkedMatchSession(matchId = normalizedMatchId, side = resolvedSide)
    }

    fun subscribeToLinkedMatch(matchId: String): Flow<LinkedMatchPayload> = callbackFlow {
        val uid = auth.currentUser?.uid ?: error("You must be signed in for linked play.")
        val normalizedMatchId = normalizeLinkedCode(matchId)
        require(normalizedMatchId.isNotBlank()) { "Match code is required." }
        val state = mutableMapOf<String, Any?>(
            "match" to null,
            "player" to null,
            "opponent" to null,
        )

        fun emitIfReady() {
            val match = state["match"] as? LinkedMatchState ?: return
            val playerSide = state["player"] as? LinkedSideState ?: return
            val opponentSide = state["opponent"] as? LinkedSideState ?: return
            trySend(LinkedMatchPayload(match = match, playerSide = playerSide, opponentSide = opponentSide))
        }

        val matchRef = db.collection("linkedMatches").document(normalizedMatchId)
        val unsubscribers = listOf(
            matchRef.addSnapshotListener { snapshot, error ->
                if (error != null) {
                    close(error)
                    return@addSnapshotListener
                }
                val data = snapshot?.data.orEmpty()
                state["match"] = LinkedMatchState(
                    matchId = data["matchId"]?.toString() ?: normalizedMatchId,
                    participants = parseParticipants(data["participants"] as? Map<*, *>),
                    sharedState = (data["sharedState"] as? Map<*, *>)?.mapKeys { it.key.toString() } ?: emptyMap(),
                )
                emitIfReady()
            },
            matchRef.collection("sides").document("player").addSnapshotListener { snapshot, error ->
                if (error != null) {
                    close(error)
                    return@addSnapshotListener
                }
                state["player"] = parseLinkedSideState(snapshot?.data.orEmpty(), "player")
                emitIfReady()
            },
            matchRef.collection("sides").document("opponent").addSnapshotListener { snapshot, error ->
                if (error != null) {
                    close(error)
                    return@addSnapshotListener
                }
                state["opponent"] = parseLinkedSideState(snapshot?.data.orEmpty(), "opponent")
                emitIfReady()
            },
        )
        awaitClose { unsubscribers.forEach { runCatching { it.remove() } } }
    }

    suspend fun updateLinkedMatchSharedState(matchId: String, game: LocalPlayState) {
        val normalizedMatchId = normalizeLinkedCode(matchId)
        require(normalizedMatchId.isNotBlank()) { "Match code is required." }
        db.collection("linkedMatches").document(normalizedMatchId).set(
            mapOf(
                "sharedState" to buildLinkedSharedState(game),
                "updatedAt" to nowIso(),
            ),
            SetOptions.merge(),
        ).await()
    }

    suspend fun updateLinkedMatchSideState(matchId: String, side: String, game: LocalPlayState) {
        val uid = auth.currentUser?.uid ?: error("You must be signed in for linked play.")
        val normalizedMatchId = normalizeLinkedCode(matchId)
        val normalizedSide = normalizeLinkedSide(side)
        require(normalizedMatchId.isNotBlank()) { "Match code is required." }
        db.collection("linkedMatches")
            .document(normalizedMatchId)
            .collection("sides")
            .document(normalizedSide)
            .set(
                buildLinkedSideState(game, normalizedSide) + mapOf(
                    "uid" to uid,
                    "updatedAt" to nowIso(),
                ),
                SetOptions.merge(),
            )
            .await()
    }

    suspend fun fetchSnapshot(): CloudSnapshot {
        val uid = auth.currentUser?.uid ?: error("You must be signed in to sync.")
        val androidMetaSnap = db.collection("users").document(uid).collection("meta").document("androidSync").get().await()
        val androidData = androidMetaSnap.data.orEmpty()

        val androidRecentSeeds = (androidData["recentSeeds"] as? List<*>)?.mapNotNull { it?.toString() } ?: emptyList()
        val androidFavorites = (androidData["favorites"] as? List<*>)?.mapNotNull { raw ->
            val map = raw as? Map<*, *> ?: return@mapNotNull null
            val seed = map["seed"]?.toString()?.trim()?.uppercase().orEmpty()
            val name = map["name"]?.toString()?.trim().orEmpty()
            if (seed.isBlank() || name.isBlank()) null else FavoriteSeed(seed = seed, name = name)
        } ?: emptyList()

        val androidLibraryMap = androidData["gameLibrary"] as? Map<*, *>
        val androidLibrary = if (androidLibraryMap != null) parseGameLibrary(androidLibraryMap) else LocalGameLibrary()

        val webMetaSnap = db.collection("users").document(uid).collection("meta").document("sync").get().await()
        val webMeta = webMetaSnap.data.orEmpty()
        val webSeedHistory = parseWebSeedHistory(webMeta["seedHistory"] as? Map<*, *>)
        val webLibrary = fetchWebLibrary(uid, webMeta)

        val recentSeeds = CloudMerge.mergeRecentSeeds(androidRecentSeeds, webSeedHistory.first)
        val favorites = CloudMerge.mergeFavorites(androidFavorites, webSeedHistory.second)
        val gameLibrary = CloudMerge.mergeLibrary(androidLibrary, webLibrary)

        return CloudSnapshot(recentSeeds = recentSeeds, favorites = favorites, gameLibrary = gameLibrary)
    }

    suspend fun syncSnapshot(snapshot: CloudSnapshot) {
        val uid = auth.currentUser?.uid ?: error("You must be signed in to sync.")
        db.collection("users")
            .document(uid)
            .collection("meta")
            .document("androidSync")
            .set(
                mapOf(
                    "recentSeeds" to snapshot.recentSeeds,
                    "favorites" to snapshot.favorites.map { mapOf("seed" to it.seed, "name" to it.name) },
                    "gameLibrary" to mapOf(
                        "activeGameId" to snapshot.gameLibrary.activeGameId,
                        "inProgress" to snapshot.gameLibrary.inProgress.map(::encodeGame),
                        "completed" to snapshot.gameLibrary.completed.map(::encodeGame),
                    ),
                    "updatedAt" to System.currentTimeMillis(),
                    "schemaVersion" to 1,
                )
            )
            .await()

        db.collection("users")
            .document(uid)
            .collection("meta")
            .document("sync")
            .set(
                mapOf(
                    "seedHistory" to mapOf(
                        "recentSeeds" to snapshot.recentSeeds,
                        "favorites" to snapshot.favorites.map { mapOf("seed" to it.seed, "name" to it.name) },
                    ),
                    "updatedAt" to System.currentTimeMillis(),
                    "schemaVersion" to 1,
                ),
                com.google.firebase.firestore.SetOptions.merge(),
            )
            .await()
    }

    private fun parseGameLibrary(raw: Map<*, *>): LocalGameLibrary {
        val activeGameId = raw["activeGameId"]?.toString()
        val inProgress = (raw["inProgress"] as? List<*>)?.mapNotNull { it as? Map<*, *> }?.mapNotNull(::decodeGame).orEmpty()
        val completed = (raw["completed"] as? List<*>)?.mapNotNull { it as? Map<*, *> }?.mapNotNull(::decodeGame).orEmpty()
        return LocalGameLibrary(activeGameId = activeGameId, inProgress = inProgress, completed = completed)
    }

    private suspend fun fetchWebLibrary(uid: String, webMeta: Map<String, Any?>): LocalGameLibrary {
        val playGamesSnapshot = db.collection("users").document(uid).collection("playGames").get().await()
        val inProgress = mutableListOf<LocalPlayState>()
        val completed = mutableListOf<LocalPlayState>()

        playGamesSnapshot.documents.forEach { document ->
            val data = document.data.orEmpty()
            val bucket = if (data["bucket"]?.toString() == "completed") "completed" else "inProgress"
            val stateMap = data["state"] as? Map<*, *> ?: return@forEach
            val game = decodeWebGame(
                stateMap = stateMap,
                fallbackGameId = data["id"]?.toString() ?: document.id,
                fallbackUpdatedAt = data["updatedAt"]?.toString(),
            ) ?: return@forEach
            if (bucket == "completed" || game.completedAt != null) completed += game else inProgress += game
        }

        return LocalGameLibrary(
            activeGameId = webMeta["activeGameId"]?.toString(),
            inProgress = inProgress.sortedByDescending { it.updatedAt },
            completed = completed.sortedByDescending { it.updatedAt },
        )
    }

    private fun parseWebSeedHistory(raw: Map<*, *>?): Pair<List<String>, List<FavoriteSeed>> {
        if (raw == null) return emptyList<String>() to emptyList()
        val recentSeeds = (raw["recentSeeds"] as? List<*>)?.mapNotNull { it?.toString()?.trim()?.uppercase() } ?: emptyList()
        val favorites = (raw["favorites"] as? List<*>)?.mapNotNull { entry ->
            val map = entry as? Map<*, *> ?: return@mapNotNull null
            val seed = map["seed"]?.toString()?.trim()?.uppercase().orEmpty()
            val name = map["name"]?.toString()?.trim().orEmpty()
            if (seed.isBlank() || name.isBlank()) null else FavoriteSeed(seed = seed, name = name)
        } ?: emptyList()
        return recentSeeds to favorites
    }

    private fun encodeGame(game: LocalPlayState): Map<String, Any?> {
        return mapOf("json" to json.encodeToString(LocalPlayState.serializer(), game))
    }

    private fun decodeGame(raw: Map<*, *>): LocalPlayState? {
        val value = raw["json"]?.toString() ?: return null
        return runCatching { json.decodeFromString(LocalPlayState.serializer(), value) }.getOrNull()
    }

    private fun decodeWebGame(
        stateMap: Map<*, *>,
        fallbackGameId: String,
        fallbackUpdatedAt: String?,
    ): LocalPlayState? {
        val patched = stateMap.toMutableMap().apply {
            putIfAbsent("gameId", fallbackGameId)
            putIfAbsent("updatedAt", fallbackUpdatedAt ?: "")
        }
        val element = anyToJsonElement(patched)
        val decoded = runCatching {
            json.decodeFromJsonElement(LocalPlayState.serializer(), element)
        }.getOrNull() ?: return null

        return decoded.copy(
            unitsByKey = decoded.unitsByKey.mapValues { (key, tracker) ->
                normalizeImportedTracker(decoded, key, tracker)
            },
        )
    }

    private fun normalizeImportedTracker(
        game: LocalPlayState,
        key: String,
        tracker: PlayUnitTracker,
    ): PlayUnitTracker {
        val existingLabel = tracker.label.takeIf { it.isNotBlank() }
        val resolvedLabel = existingLabel ?: deriveTrackerLabel(game, key, tracker)
        val normalizedMaxPools = tracker.maxHealthPools.mapIndexed { index, pool ->
            pool.copy(label = pool.label.ifBlank { defaultPoolLabel(tracker.maxHealthPools, index, pool) })
        }
        val normalizedCurrentPools = tracker.currentHealthPools.mapIndexed { index, pool ->
            pool.copy(label = pool.label.ifBlank { normalizedMaxPools.getOrNull(index)?.label ?: defaultPoolLabel(tracker.currentHealthPools, index, pool) })
        }
        return tracker.copy(
            label = resolvedLabel,
            maxHealthPools = normalizedMaxPools,
            currentHealthPools = normalizedCurrentPools,
        )
    }

    private fun deriveTrackerLabel(
        game: LocalPlayState,
        key: String,
        tracker: PlayUnitTracker,
    ): String {
        val roster = if (tracker.side == "opponent") game.opponentRoster ?: game.playerRoster else game.playerRoster
        val index = key.substringAfterLast('-', "").toIntOrNull()
        val unitId = key.substringAfter(':').substringBeforeLast('-')
        val unit = roster.units.firstOrNull { it.id == unitId }
            ?: index?.let { roster.units.getOrNull(it) }
        return buildString {
            append(unit?.name ?: key.substringAfter(':'))
            val models = unit?.models ?: 1
            if (models > 1) append(" x$models")
        }
    }

    private fun defaultPoolLabel(pools: List<PlayHealthPool>, index: Int, pool: PlayHealthPool): String {
        return if (pool.type == "shield") {
            "SHD"
        } else {
            val hpIndex = pools.take(index + 1).count { it.type == "hp" }
            if (pools.count { it.type == "hp" } > 1) "M$hpIndex" else "HP"
        }
    }

    private fun anyToJsonElement(value: Any?): JsonElement = when (value) {
        null -> JsonNull
        is JsonElement -> value
        is String -> JsonPrimitive(value)
        is Number -> JsonPrimitive(value)
        is Boolean -> JsonPrimitive(value)
        is Map<*, *> -> JsonObject(value.entries.associate { (key, nested) -> key.toString() to anyToJsonElement(nested) })
        is List<*> -> JsonArray(value.map(::anyToJsonElement))
        else -> JsonPrimitive(value.toString())
    }

    private fun buildLinkedSharedState(game: LocalPlayState): Map<String, Any?> {
        return mapOf(
            "hasStarted" to game.hasStarted,
            "round" to game.round,
            "phaseIndex" to game.phaseIndex,
            "firstPlayer" to game.firstPlayer,
            "missionName" to game.missionName,
            "gameLength" to game.gameLength,
            "startingSupply" to game.startingSupply,
            "supplyPerRound" to game.supplyPerRound,
            "gameSize" to game.gameSize,
        )
    }

    private fun buildLinkedSideState(game: LocalPlayState, side: String): Map<String, Any?> {
        val normalizedSide = normalizeLinkedSide(side)
        val isPlayer = normalizedSide == "player"
        val roster = if (isPlayer) game.playerRoster else game.opponentRoster
        return mapOf(
            "side" to normalizedSide,
            "name" to if (isPlayer) game.playerName else game.opponentName,
            "seed" to if (isPlayer) game.playerSeed else (game.opponentSeed ?: ""),
            "faction" to (roster?.faction ?: if (isPlayer) game.playerRoster.faction else game.opponentFaction),
            "score" to if (isPlayer) game.playerScore else game.opponentScore,
            "resource" to if (isPlayer) game.playerResource else game.opponentResource,
            "activationRound" to game.round,
            "roster" to roster,
            "unitsByKey" to game.unitsByKey.filterKeys { it.startsWith("$normalizedSide:") },
        )
    }

    private fun parseParticipants(raw: Map<*, *>?): Map<String, String?> {
        if (raw == null) return emptyMap()
        return mapOf(
            "playerUid" to raw["playerUid"]?.toString(),
            "opponentUid" to raw["opponentUid"]?.toString(),
        )
    }

    private fun parseLinkedSideState(raw: Map<String, Any?>, side: String): LinkedSideState {
        val roster = (raw["roster"] as? Map<*, *>)?.let { decodeParsedRoster(it) }
        val units = (raw["unitsByKey"] as? Map<*, *>)?.entries?.mapNotNull { (key, value) ->
            val tracker = (value as? Map<*, *>)?.let { decodeTracker(it) } ?: return@mapNotNull null
            key.toString() to tracker
        }?.toMap().orEmpty()

        return LinkedSideState(
            side = normalizeLinkedSide(raw["side"]?.toString() ?: side),
            name = raw["name"]?.toString() ?: if (side == "player") "Player" else "Opponent",
            seed = raw["seed"]?.toString()?.trim()?.uppercase().orEmpty(),
            faction = raw["faction"]?.toString() ?: "Unknown",
            score = (raw["score"] as? Number)?.toInt() ?: 0,
            resource = (raw["resource"] as? Number)?.toInt() ?: 0,
            activationRound = (raw["activationRound"] as? Number)?.toInt() ?: 1,
            roster = roster,
            unitsByKey = units,
        )
    }

    private fun decodeParsedRoster(raw: Map<*, *>): ParsedRoster? =
        runCatching { json.decodeFromJsonElement(ParsedRoster.serializer(), anyToJsonElement(raw)) }.getOrNull()

    private fun decodeTracker(raw: Map<*, *>): PlayUnitTracker? =
        runCatching { json.decodeFromJsonElement(PlayUnitTracker.serializer(), anyToJsonElement(raw)) }.getOrNull()

    private fun normalizeLinkedSide(side: String): String = if (side == "opponent") "opponent" else "player"

    private fun normalizeLinkedCode(value: String): String =
        value.trim().uppercase().replace(Regex("[^A-Z0-9]"), "").take(10)

    private fun generateLinkedMatchCode(length: Int = 6): String {
        val alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
        return buildString {
            repeat(length) {
                append(alphabet.random())
            }
        }
    }

    private fun nowIso(): String = java.time.Instant.now().toString()

    private suspend fun requestGoogleIdToken(activity: Activity, serverClientId: String): String {
        return try {
            requestGoogleIdToken(activity, serverClientId, filterAuthorizedAccounts = true)
        } catch (_: NoCredentialException) {
            requestGoogleIdToken(activity, serverClientId, filterAuthorizedAccounts = false)
        }
    }

    private suspend fun requestGoogleIdToken(
        activity: Activity,
        serverClientId: String,
        filterAuthorizedAccounts: Boolean,
    ): String {
        val googleIdOption = GetGoogleIdOption.Builder()
            .setServerClientId(serverClientId)
            .setFilterByAuthorizedAccounts(filterAuthorizedAccounts)
            .setAutoSelectEnabled(!filterAuthorizedAccounts)
            .build()

        val request = GetCredentialRequest.Builder()
            .addCredentialOption(googleIdOption)
            .build()

        val result = try {
            credentialManager.getCredential(activity, request)
        } catch (error: GetCredentialException) {
            throw error
        }

        val credential = result.credential
        if (credential is CustomCredential && credential.type == GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL) {
            try {
                return GoogleIdTokenCredential.createFrom(credential.data).idToken
            } catch (error: GoogleIdTokenParsingException) {
                error("Unable to parse the Google ID token: ${error.message}")
            }
        }

        error("Unexpected credential response from Google sign-in.")
    }

    private fun ensureFirebaseApp(): FirebaseApp {
        FirebaseApp.getApps(appContext).firstOrNull { it.name == "scadjutant-android" }?.let { return it }
        return FirebaseApp.initializeApp(
            appContext,
            FirebaseOptions.Builder()
                .setApiKey("AIzaSyAyCbNFlBqkCy73YKmyAieUVyubWeuCxXU")
                .setApplicationId("1:561160921740:android:5bc052bb39058d9a8451a9")
                .setProjectId("starcrafttmg-dc616")
                .setStorageBucket("starcrafttmg-dc616.firebasestorage.app")
                .setGcmSenderId("561160921740")
                .build(),
            "scadjutant-android"
        )
    }
}
