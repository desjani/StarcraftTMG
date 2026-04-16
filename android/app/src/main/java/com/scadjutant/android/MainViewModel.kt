package com.scadjutant.android

import android.app.Application
import android.app.Activity
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.scadjutant.android.data.AppStorage
import com.scadjutant.android.data.LinkedMatchPayload
import com.scadjutant.android.data.CloudSnapshot
import com.scadjutant.android.data.CloudSyncRepository
import com.scadjutant.android.data.RosterRepository
import com.scadjutant.android.domain.CloudMerge
import com.scadjutant.android.domain.PlayStateFactory
import com.scadjutant.android.model.FavoriteSeed
import com.scadjutant.android.model.LocalGameLibrary
import com.scadjutant.android.model.LocalPlayState
import com.scadjutant.android.model.ParsedRoster
import com.scadjutant.android.model.RosterUnit
import com.scadjutant.android.model.UnitTypeOrder
import kotlinx.serialization.Serializable
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch

enum class AppTab {
    LIBRARY,
    ROSTER,
    AID,
    PLAY,
    SETTINGS,
}

@Serializable
data class RosterViewOptions(
    val showUpgrades: Boolean = true,
    val showStats: Boolean = false,
    val showSize: Boolean = true,
    val showCost: Boolean = true,
    val showTactical: Boolean = true,
    val showTacticalResource: Boolean = true,
    val showTacticalGas: Boolean = true,
    val showTacticalSupply: Boolean = true,
    val showSlots: Boolean = true,
)

data class PlayerAidOptions(
    val showStats: Boolean = true,
    val showAllUpgrades: Boolean = true,
    val showActivation: Boolean = true,
    val showTactical: Boolean = true,
)

data class PlaySetupState(
    val playerName: String = "Player",
    val opponentName: String = "Opponent",
    val opponentSeed: String = "",
    val missionName: String = "Mission",
    val gameLength: String = "5",
    val startingSupply: String = "10",
    val supplyPerRound: String = "2",
    val gameSize: String = "2000",
)

data class MainUiState(
    val selectedTab: AppTab = AppTab.LIBRARY,
    val seedInput: String = "",
    val isLoading: Boolean = false,
    val errorMessage: String? = null,
    val currentRoster: ParsedRoster? = null,
    val rosterOptions: RosterViewOptions = RosterViewOptions(),
    val playerAidOptions: PlayerAidOptions = PlayerAidOptions(),
    val recentSeeds: List<String> = emptyList(),
    val favoriteSeeds: List<FavoriteSeed> = emptyList(),
    val activeLocalGame: LocalPlayState? = null,
    val localGameLibrary: LocalGameLibrary = LocalGameLibrary(),
    val showNewGameSetup: Boolean = false,
    val showLinkedCreateSetup: Boolean = false,
    val showLinkedJoinSetup: Boolean = false,
    val playSetup: PlaySetupState = PlaySetupState(),
    val playSetupError: String? = null,
    val isCreatingLocalGame: Boolean = false,
    val linkedJoinCode: String = "",
    val linkedSyncStatus: String? = null,
    val isLinkedBusy: Boolean = false,
    val isGoogleSignInConfigured: Boolean = false,
    val cloudProviderLabel: String? = null,
    val cloudDisplayName: String? = null,
    val cloudEmail: String? = null,
    val cloudUserId: String? = null,
    val cloudStatus: String = "Local-only",
    val isCloudBusy: Boolean = false,
)

class MainViewModel(
    application: Application,
    private val repository: RosterRepository,
    private val storage: AppStorage,
    private val cloudSyncRepository: CloudSyncRepository,
) : AndroidViewModel(application) {

    private val _uiState = MutableStateFlow(MainUiState())
    val uiState: StateFlow<MainUiState> = _uiState.asStateFlow()
    private var linkedSubscriptionJob: Job? = null

    init {
        _uiState.update {
            it.copy(isGoogleSignInConfigured = cloudSyncRepository.isGoogleSignInConfigured())
        }

        viewModelScope.launch {
            combine(
                storage.recentSeeds,
                storage.favoriteSeeds,
                storage.activeLocalGame,
                storage.localGameLibrary,
                storage.rosterViewOptions,
            ) { recents, favorites, game, library, rosterOptions ->
                Snapshot(recents, favorites, game, library, rosterOptions)
            }.collect { snapshot ->
                _uiState.update { state ->
                    state.copy(
                        recentSeeds = snapshot.recents,
                        favoriteSeeds = snapshot.favorites,
                        activeLocalGame = snapshot.game,
                        localGameLibrary = snapshot.library,
                        rosterOptions = snapshot.rosterOptions,
                    )
                }
            }
        }

        viewModelScope.launch {
            cloudSyncRepository.authState().collect { user ->
                _uiState.update {
                    it.copy(
                        cloudUserId = user?.uid,
                        cloudProviderLabel = user?.providerData
                            ?.mapNotNull { info -> info.providerId.takeUnless { provider -> provider == "firebase" } }
                            ?.firstOrNull()
                            ?.let(::providerDisplayName)
                            ?: if (user?.isAnonymous == true) "Anonymous" else null,
                        cloudDisplayName = user?.displayName,
                        cloudEmail = user?.email,
                        cloudStatus = if (user == null) "Local-only" else "Signed in",
                    )
                }
            }
        }
    }

    fun updateSeedInput(value: String) {
        _uiState.update { state ->
            state.copy(seedInput = value.uppercase().take(8), errorMessage = null)
        }
    }

    fun selectTab(tab: AppTab) {
        _uiState.update { it.copy(selectedTab = tab) }
    }

    fun toggleRosterOption(update: (RosterViewOptions) -> RosterViewOptions) {
        viewModelScope.launch {
            val nextOptions = update(_uiState.value.rosterOptions)
            storage.saveRosterViewOptions(nextOptions)
            _uiState.update { state -> state.copy(rosterOptions = nextOptions) }
        }
    }

    fun toggleAidOption(update: (PlayerAidOptions) -> PlayerAidOptions) {
        _uiState.update { state -> state.copy(playerAidOptions = update(state.playerAidOptions)) }
    }

    fun loadRoster(seedOverride: String? = null) {
        val normalizedSeed = (seedOverride ?: _uiState.value.seedInput).trim().uppercase()
        if (normalizedSeed.isBlank()) {
            _uiState.update { it.copy(errorMessage = "Enter a roster seed first.") }
            return
        }

        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, errorMessage = null) }
            runCatching {
                repository.loadRoster(normalizedSeed)
            }.onSuccess { roster ->
                val nextRecents = listOf(roster.seed) + _uiState.value.recentSeeds.filterNot { it == roster.seed }
                storage.saveRecentSeeds(nextRecents.take(10))
                _uiState.update { state ->
                    state.copy(
                        isLoading = false,
                        currentRoster = roster,
                        seedInput = roster.seed,
                        selectedTab = AppTab.ROSTER,
                    )
                }
            }.onFailure { error ->
                _uiState.update {
                    it.copy(
                        isLoading = false,
                        errorMessage = error.message ?: "Unable to load that roster."
                    )
                }
            }
        }
    }

    fun saveCurrentRosterToFavorites(name: String) {
        val roster = _uiState.value.currentRoster ?: return
        viewModelScope.launch {
            val favorites = _uiState.value.favoriteSeeds.toMutableList()
            val trimmedName = name.trim()
            if (trimmedName.isBlank()) {
                _uiState.update { it.copy(errorMessage = "Enter a favorite name first.") }
                return@launch
            }
            if (favorites.any { it.seed == roster.seed }) {
                _uiState.update { it.copy(errorMessage = "That seed is already saved to favorites.") }
                return@launch
            }
            if (favorites.any { it.name.equals(trimmedName, ignoreCase = true) }) {
                _uiState.update { it.copy(errorMessage = "That favorite name is already taken.") }
                return@launch
            }
            favorites.add(0, FavoriteSeed(seed = roster.seed, name = trimmedName))
            storage.saveFavoriteSeeds(favorites)
            _uiState.update { it.copy(errorMessage = null) }
        }
    }

    fun loadFavorite(seed: String) {
        loadRoster(seed)
    }

    fun renameFavorite(seed: String, name: String) {
        viewModelScope.launch {
            val trimmedName = name.trim()
            if (trimmedName.isBlank()) {
                _uiState.update { it.copy(errorMessage = "Favorite name cannot be empty.") }
                return@launch
            }
            if (_uiState.value.favoriteSeeds.any { it.seed != seed && it.name.equals(trimmedName, ignoreCase = true) }) {
                _uiState.update { it.copy(errorMessage = "That favorite name is already taken.") }
                return@launch
            }
            val updated = _uiState.value.favoriteSeeds.map { favorite ->
                if (favorite.seed == seed) favorite.copy(name = trimmedName) else favorite
            }
            storage.saveFavoriteSeeds(updated)
            _uiState.update { it.copy(errorMessage = null) }
        }
    }

    fun deleteFavorite(seed: String) {
        viewModelScope.launch {
            storage.saveFavoriteSeeds(_uiState.value.favoriteSeeds.filterNot { it.seed == seed })
            _uiState.update { it.copy(errorMessage = null) }
        }
    }

    fun moveFavorite(seed: String, direction: Int) {
        viewModelScope.launch {
            val favorites = _uiState.value.favoriteSeeds.toMutableList()
            val currentIndex = favorites.indexOfFirst { it.seed == seed }
            if (currentIndex < 0) return@launch
            val targetIndex = (currentIndex + direction).coerceIn(0, favorites.lastIndex)
            if (targetIndex == currentIndex) return@launch
            val favorite = favorites.removeAt(currentIndex)
            favorites.add(targetIndex, favorite)
            storage.saveFavoriteSeeds(favorites)
        }
    }

    fun openNewGameSetup() {
        val roster = _uiState.value.currentRoster ?: return
        _uiState.update {
            it.copy(
                selectedTab = AppTab.PLAY,
                showNewGameSetup = true,
                showLinkedCreateSetup = false,
                showLinkedJoinSetup = false,
                playSetup = it.playSetup.copy(
                    playerName = it.playSetup.playerName.ifBlank { "Player" },
                    opponentName = it.playSetup.opponentName.ifBlank { "Opponent" },
                    gameSize = roster.minerals.limit.toString(),
                ),
                playSetupError = null,
            )
        }
    }

    fun closeNewGameSetup() {
        _uiState.update {
            it.copy(
                showNewGameSetup = false,
                showLinkedCreateSetup = false,
                showLinkedJoinSetup = false,
                playSetupError = null,
                isCreatingLocalGame = false,
                isLinkedBusy = false,
            )
        }
    }

    fun updatePlaySetup(update: (PlaySetupState) -> PlaySetupState) {
        _uiState.update { it.copy(playSetup = update(it.playSetup), playSetupError = null) }
    }

    fun startLocalGame() {
        val roster = _uiState.value.currentRoster ?: return
        val setup = _uiState.value.playSetup
        viewModelScope.launch {
            _uiState.update { it.copy(isCreatingLocalGame = true, playSetupError = null) }

            val opponentSeed = setup.opponentSeed.trim().uppercase()
            val opponentRoster = runCatching {
                if (opponentSeed.isBlank()) {
                    null
                } else {
                    repository.loadRoster(opponentSeed)
                }
            }.getOrElse { error ->
                _uiState.update {
                    it.copy(
                        isCreatingLocalGame = false,
                        playSetupError = error.message ?: "Unable to load the opponent roster."
                    )
                }
                return@launch
            }

            val game = PlayStateFactory.createLocalGame(
                roster = roster,
                playerName = setup.playerName,
                opponentName = setup.opponentName,
                opponentRoster = opponentRoster,
                missionName = setup.missionName,
                gameLength = setup.gameLength.toIntOrNull() ?: 5,
                startingSupply = setup.startingSupply.toIntOrNull() ?: 10,
                supplyPerRound = setup.supplyPerRound.toIntOrNull() ?: 2,
                gameSize = setup.gameSize.toIntOrNull() ?: roster.minerals.limit,
            )
            storage.saveActiveLocalGame(game)
            storage.saveLocalGameLibrary(PlayStateFactory.saveGameToLibrary(_uiState.value.localGameLibrary, game))
            _uiState.update {
                it.copy(
                    selectedTab = AppTab.PLAY,
                    showNewGameSetup = false,
                    playSetupError = null,
                    isCreatingLocalGame = false,
                )
            }
        }
    }

    fun clearLocalGame() {
        val game = _uiState.value.activeLocalGame
        viewModelScope.launch {
            if (game?.isLinkedGame == true) {
                linkedSubscriptionJob?.cancel()
                linkedSubscriptionJob = null
            }
            storage.saveActiveLocalGame(null)
            if (game != null) {
                storage.saveLocalGameLibrary(PlayStateFactory.completeGame(_uiState.value.localGameLibrary, game))
            }
        }
    }

    fun restoreLocalGame(gameId: String) {
        val game = _uiState.value.localGameLibrary.inProgress.firstOrNull { it.gameId == gameId } ?: return
        viewModelScope.launch {
            storage.saveActiveLocalGame(game)
            _uiState.update { it.copy(selectedTab = AppTab.PLAY, showNewGameSetup = false) }
            if (game.isLinkedGame && !game.linkedMatchId.isNullOrBlank()) {
                startLinkedSubscription(game.linkedMatchId)
            }
        }
    }

    fun openLinkedCreateSetup() {
        val roster = _uiState.value.currentRoster ?: return
        if (_uiState.value.cloudUserId == null) {
            _uiState.update { it.copy(selectedTab = AppTab.SETTINGS, cloudStatus = "Sign in to use linked play.") }
            return
        }
        _uiState.update {
            it.copy(
                selectedTab = AppTab.PLAY,
                showLinkedCreateSetup = true,
                showLinkedJoinSetup = false,
                showNewGameSetup = false,
                playSetup = it.playSetup.copy(
                    playerName = it.playSetup.playerName.ifBlank { "Player 1" },
                    opponentName = "Player 2",
                    gameSize = roster.minerals.limit.toString(),
                ),
                playSetupError = null,
            )
        }
    }

    fun openLinkedJoinSetup() {
        if (_uiState.value.cloudUserId == null) {
            _uiState.update { it.copy(selectedTab = AppTab.SETTINGS, cloudStatus = "Sign in to use linked play.") }
            return
        }
        _uiState.update {
            it.copy(
                selectedTab = AppTab.PLAY,
                showLinkedJoinSetup = true,
                showLinkedCreateSetup = false,
                showNewGameSetup = false,
                playSetup = it.playSetup.copy(playerName = it.playSetup.playerName.ifBlank { "Player 2" }),
                playSetupError = null,
            )
        }
    }

    fun updateLinkedJoinCode(value: String) {
        _uiState.update {
            it.copy(linkedJoinCode = value.uppercase().filter(Char::isLetterOrDigit).take(10), playSetupError = null)
        }
    }

    fun createLinkedGame() {
        val roster = _uiState.value.currentRoster ?: run {
            _uiState.update { it.copy(playSetupError = "Load your roster first.") }
            return
        }
        if (_uiState.value.cloudUserId == null) {
            _uiState.update { it.copy(playSetupError = "Sign in first to create a linked game.") }
            return
        }

        val setup = _uiState.value.playSetup
        viewModelScope.launch {
            _uiState.update { it.copy(isLinkedBusy = true, playSetupError = null) }
            runCatching {
                val game = PlayStateFactory.createLocalGame(
                    roster = roster,
                    playerName = setup.playerName,
                    opponentName = "Player 2",
                    missionName = setup.missionName,
                    gameLength = setup.gameLength.toIntOrNull() ?: 5,
                    startingSupply = setup.startingSupply.toIntOrNull() ?: 10,
                    supplyPerRound = setup.supplyPerRound.toIntOrNull() ?: 2,
                    gameSize = setup.gameSize.toIntOrNull() ?: roster.minerals.limit,
                ).copy(
                    isLinkedGame = true,
                    linkedReady = false,
                    linkedSide = "player",
                )
                val session = cloudSyncRepository.createLinkedMatch(game, hostSide = "player")
                val linkedGame = game.copy(linkedMatchId = session.matchId, linkedSide = session.side)
                storage.saveActiveLocalGame(linkedGame)
                storage.saveLocalGameLibrary(PlayStateFactory.saveGameToLibrary(_uiState.value.localGameLibrary, linkedGame))
                startLinkedSubscription(session.matchId)
                _uiState.update {
                    it.copy(
                        isLinkedBusy = false,
                        showLinkedCreateSetup = false,
                        linkedSyncStatus = "Linked game created: ${session.matchId}",
                    )
                }
            }.onFailure { error ->
                _uiState.update { it.copy(isLinkedBusy = false, playSetupError = error.message ?: "Unable to create linked game.") }
            }
        }
    }

    fun joinLinkedGame() {
        val roster = _uiState.value.currentRoster ?: run {
            _uiState.update { it.copy(playSetupError = "Load your roster first.") }
            return
        }
        if (_uiState.value.cloudUserId == null) {
            _uiState.update { it.copy(playSetupError = "Sign in first to join linked play.") }
            return
        }
        val code = _uiState.value.linkedJoinCode.trim().uppercase()
        if (code.isBlank()) {
            _uiState.update { it.copy(playSetupError = "Enter a linked game code.") }
            return
        }

        val setup = _uiState.value.playSetup
        viewModelScope.launch {
            _uiState.update { it.copy(isLinkedBusy = true, playSetupError = null) }
            runCatching {
                val session = cloudSyncRepository.joinLinkedMatch(code)
                val game = PlayStateFactory.createLocalGame(
                    roster = roster,
                    playerName = if (session.side == "player") setup.playerName else "Player 1",
                    opponentName = if (session.side == "player") "Player 2" else setup.playerName,
                    missionName = setup.missionName,
                    gameLength = setup.gameLength.toIntOrNull() ?: 5,
                    startingSupply = setup.startingSupply.toIntOrNull() ?: 10,
                    supplyPerRound = setup.supplyPerRound.toIntOrNull() ?: 2,
                    gameSize = setup.gameSize.toIntOrNull() ?: roster.minerals.limit,
                ).copy(
                    isLinkedGame = true,
                    linkedReady = false,
                    linkedMatchId = session.matchId,
                    linkedSide = session.side,
                )
                val preparedGame = if (session.side == "player") {
                    game.copy(playerName = setup.playerName)
                } else {
                    game.copy(
                        playerName = "Player 1",
                        opponentName = setup.playerName,
                        playerRoster = roster,
                        playerSeed = roster.seed,
                    )
                }
                storage.saveActiveLocalGame(preparedGame)
                storage.saveLocalGameLibrary(PlayStateFactory.saveGameToLibrary(_uiState.value.localGameLibrary, preparedGame))
                cloudSyncRepository.updateLinkedMatchSideState(session.matchId, session.side, preparedGame)
                startLinkedSubscription(session.matchId)
                _uiState.update {
                    it.copy(
                        isLinkedBusy = false,
                        showLinkedJoinSetup = false,
                        linkedSyncStatus = "Joined linked game ${session.matchId} as ${session.side}",
                    )
                }
            }.onFailure { error ->
                _uiState.update { it.copy(isLinkedBusy = false, playSetupError = error.message ?: "Unable to join linked game.") }
            }
        }
    }

    fun signInCloudAnonymously() {
        viewModelScope.launch {
            _uiState.update { it.copy(isCloudBusy = true, cloudStatus = "Signing in...") }
            runCatching {
                cloudSyncRepository.signInAnonymously()
                pullFromCloud()
                pushToCloud()
            }.onSuccess {
                _uiState.update { it.copy(isCloudBusy = false, cloudStatus = "Signed in and synced") }
            }.onFailure { error ->
                _uiState.update { it.copy(isCloudBusy = false, cloudStatus = error.message ?: "Cloud sign-in failed") }
            }
        }
    }

    fun signInCloudWithGoogle(activity: Activity) {
        viewModelScope.launch {
            _uiState.update { it.copy(isCloudBusy = true, cloudStatus = "Opening Google sign-in...") }
            runCatching {
                cloudSyncRepository.signInWithGoogle(activity)
                pullFromCloud()
                pushToCloud()
            }.onSuccess {
                _uiState.update { it.copy(isCloudBusy = false, cloudStatus = "Signed in with Google and synced") }
            }.onFailure { error ->
                _uiState.update { it.copy(isCloudBusy = false, cloudStatus = error.message ?: "Google sign-in failed") }
            }
        }
    }

    fun signOutCloud() {
        viewModelScope.launch {
            runCatching { cloudSyncRepository.signOut() }
            _uiState.update { it.copy(cloudStatus = "Local-only") }
        }
    }

    fun syncCloudNow() {
        viewModelScope.launch {
            _uiState.update { it.copy(isCloudBusy = true, cloudStatus = "Syncing...") }
            runCatching {
                pullFromCloud()
                pushToCloud()
            }.onSuccess {
                _uiState.update { it.copy(isCloudBusy = false, cloudStatus = "Synced") }
            }.onFailure { error ->
                _uiState.update { it.copy(isCloudBusy = false, cloudStatus = error.message ?: "Sync failed") }
            }
        }
    }

    fun advancePlayPhase() = updateLocalGame { PlayStateFactory.advancePhase(it) }

    fun adjustPlayScore(side: String, delta: Int) = updateLocalGame { PlayStateFactory.adjustScore(it, side, delta) }

    fun adjustPlayResource(side: String, delta: Int) = updateLocalGame { PlayStateFactory.adjustResource(it, side, delta) }

    fun toggleUnitDeployment(unitKey: String) = updateLocalGame { PlayStateFactory.toggleDeployed(it, unitKey) }

    fun toggleUnitActivation(unitKey: String, phaseKey: String) =
        updateLocalGame { PlayStateFactory.toggleActivation(it, unitKey, phaseKey) }

    fun adjustUnitHealth(unitKey: String, delta: Int) =
        updateLocalGame { PlayStateFactory.adjustTrackerHealth(it, unitKey, delta) }

    private fun updateLocalGame(transform: (LocalPlayState) -> LocalPlayState) {
        val game = _uiState.value.activeLocalGame ?: return
        viewModelScope.launch {
            val nextGame = transform(game)
            if (nextGame.completedAt != null) {
                storage.saveActiveLocalGame(null)
                storage.saveLocalGameLibrary(PlayStateFactory.completeGame(_uiState.value.localGameLibrary, nextGame))
            } else {
                storage.saveActiveLocalGame(nextGame)
                storage.saveLocalGameLibrary(PlayStateFactory.saveGameToLibrary(_uiState.value.localGameLibrary, nextGame))
                syncLinkedState(nextGame)
            }
        }
    }

    private suspend fun syncLinkedState(game: LocalPlayState) {
        if (!game.isLinkedGame || game.linkedMatchId.isNullOrBlank() || game.linkedSide.isNullOrBlank()) return
        runCatching {
            cloudSyncRepository.updateLinkedMatchSharedState(game.linkedMatchId, game)
            cloudSyncRepository.updateLinkedMatchSideState(game.linkedMatchId, game.linkedSide, game)
            _uiState.update { it.copy(linkedSyncStatus = "Linked sync active: ${game.linkedMatchId}") }
        }.onFailure { error ->
            _uiState.update { it.copy(linkedSyncStatus = error.message ?: "Linked sync failed") }
        }
    }

    private fun startLinkedSubscription(matchId: String?) {
        val normalized = matchId?.trim()?.uppercase().orEmpty()
        if (normalized.isBlank()) return
        linkedSubscriptionJob?.cancel()
        linkedSubscriptionJob = viewModelScope.launch {
            cloudSyncRepository.subscribeToLinkedMatch(normalized).collect { payload ->
                applyLinkedPayload(payload)
            }
        }
    }

    private suspend fun applyLinkedPayload(payload: LinkedMatchPayload) {
        val current = _uiState.value.activeLocalGame ?: return
        if (current.linkedMatchId != payload.match.matchId) return
        val side = current.linkedSide ?: "player"
        val playerRoster = payload.playerSide.roster ?: current.playerRoster
        val opponentRoster = payload.opponentSide.roster ?: current.opponentRoster

        val merged = current.copy(
            playerSeed = payload.playerSide.seed.ifBlank { current.playerSeed },
            playerRoster = playerRoster,
            opponentSeed = payload.opponentSide.seed.ifBlank { current.opponentSeed },
            opponentRoster = opponentRoster,
            playerName = payload.playerSide.name,
            opponentName = payload.opponentSide.name,
            opponentFaction = payload.opponentSide.faction.ifBlank { current.opponentFaction },
            missionName = payload.match.sharedState["missionName"]?.toString() ?: current.missionName,
            gameLength = (payload.match.sharedState["gameLength"] as? Number)?.toInt() ?: current.gameLength,
            startingSupply = (payload.match.sharedState["startingSupply"] as? Number)?.toInt() ?: current.startingSupply,
            supplyPerRound = (payload.match.sharedState["supplyPerRound"] as? Number)?.toInt() ?: current.supplyPerRound,
            gameSize = (payload.match.sharedState["gameSize"] as? Number)?.toInt() ?: current.gameSize,
            round = (payload.match.sharedState["round"] as? Number)?.toInt() ?: current.round,
            phaseIndex = (payload.match.sharedState["phaseIndex"] as? Number)?.toInt() ?: current.phaseIndex,
            firstPlayer = payload.match.sharedState["firstPlayer"]?.toString() ?: current.firstPlayer,
            playerScore = payload.playerSide.score,
            opponentScore = payload.opponentSide.score,
            playerResource = payload.playerSide.resource,
            opponentResource = payload.opponentSide.resource,
            linkedReady = payload.match.participants["playerUid"] != null &&
                payload.match.participants["opponentUid"] != null &&
                playerRoster != null &&
                opponentRoster != null &&
                payload.playerSide.seed.isNotBlank() &&
                payload.opponentSide.seed.isNotBlank(),
            linkedMatchId = payload.match.matchId,
            linkedSide = side,
            unitsByKey = payload.playerSide.unitsByKey + payload.opponentSide.unitsByKey,
        )
        storage.saveActiveLocalGame(merged)
        storage.saveLocalGameLibrary(PlayStateFactory.saveGameToLibrary(_uiState.value.localGameLibrary, merged))
        _uiState.update { it.copy(linkedSyncStatus = "Linked sync active: ${payload.match.matchId}") }
    }

    private suspend fun pullFromCloud() {
        val snapshot = cloudSyncRepository.fetchSnapshot()
        val mergedRecents = CloudMerge.mergeRecentSeeds(_uiState.value.recentSeeds, snapshot.recentSeeds)
        val mergedFavorites = CloudMerge.mergeFavorites(_uiState.value.favoriteSeeds, snapshot.favorites)
        val mergedLibrary = CloudMerge.mergeLibrary(_uiState.value.localGameLibrary, snapshot.gameLibrary)
        storage.saveRecentSeeds(mergedRecents)
        storage.saveFavoriteSeeds(mergedFavorites)
        storage.saveLocalGameLibrary(mergedLibrary)
        val activeGame = mergedLibrary.activeGameId?.let { id -> mergedLibrary.inProgress.firstOrNull { it.gameId == id } }
        storage.saveActiveLocalGame(activeGame)
    }

    private suspend fun pushToCloud() {
        cloudSyncRepository.syncSnapshot(
            CloudSnapshot(
                recentSeeds = _uiState.value.recentSeeds,
                favorites = _uiState.value.favoriteSeeds,
                gameLibrary = _uiState.value.localGameLibrary,
            )
        )
    }

    fun unitSectionsForAid(roster: ParsedRoster?): Map<String, List<RosterUnit>> {
        val units = roster?.units ?: return emptyMap()
        return UnitTypeOrder.associateWith { type ->
            units.filter { it.type == type }
        }.filterValues { it.isNotEmpty() }
    }

    companion object {
        fun factory(application: Application): ViewModelProvider.Factory = object : ViewModelProvider.Factory {
            @Suppress("UNCHECKED_CAST")
            override fun <T : ViewModel> create(modelClass: Class<T>): T {
                return MainViewModel(
                    application = application,
                    repository = RosterRepository(),
                    storage = AppStorage(application),
                    cloudSyncRepository = CloudSyncRepository(application),
                ) as T
            }
        }
    }
}

private fun providerDisplayName(providerId: String): String = when (providerId) {
    "google.com" -> "Google"
    "password" -> "Email"
    "anonymous" -> "Anonymous"
    else -> providerId
}

private data class Snapshot(
    val recents: List<String>,
    val favorites: List<FavoriteSeed>,
    val game: LocalPlayState?,
    val library: LocalGameLibrary,
    val rosterOptions: RosterViewOptions,
)
