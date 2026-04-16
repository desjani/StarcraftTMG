package com.scadjutant.android.data

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.scadjutant.android.model.FavoriteSeed
import com.scadjutant.android.model.LocalGameLibrary
import com.scadjutant.android.model.LocalPlayState
import com.scadjutant.android.RosterViewOptions
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import kotlinx.serialization.builtins.ListSerializer
import kotlinx.serialization.builtins.serializer
import kotlinx.serialization.json.Json

private val Context.appDataStore by preferencesDataStore(name = "scadjutant_prefs")

class AppStorage(private val context: Context) {
    private val json = Json { ignoreUnknownKeys = true }

    val recentSeeds: Flow<List<String>> = context.appDataStore.data.map { prefs ->
        prefs[RECENT_SEEDS]?.let { raw ->
            runCatching { json.decodeFromString(ListSerializer(String.serializer()), raw) }.getOrDefault(emptyList())
        } ?: emptyList()
    }

    val favoriteSeeds: Flow<List<FavoriteSeed>> = context.appDataStore.data.map { prefs ->
        prefs[FAVORITES]?.let { raw ->
            runCatching { json.decodeFromString(ListSerializer(FavoriteSeed.serializer()), raw) }.getOrDefault(emptyList())
        } ?: emptyList()
    }

    val activeLocalGame: Flow<LocalPlayState?> = context.appDataStore.data.map { prefs ->
        prefs[ACTIVE_LOCAL_GAME]?.let { raw ->
            runCatching { json.decodeFromString(LocalPlayState.serializer(), raw) }.getOrNull()
        }
    }

    val localGameLibrary: Flow<LocalGameLibrary> = context.appDataStore.data.map { prefs ->
        prefs[LOCAL_GAME_LIBRARY]?.let { raw ->
            runCatching { json.decodeFromString(LocalGameLibrary.serializer(), raw) }.getOrDefault(LocalGameLibrary())
        } ?: LocalGameLibrary()
    }

    val rosterViewOptions: Flow<RosterViewOptions> = context.appDataStore.data.map { prefs ->
        prefs[ROSTER_VIEW_OPTIONS]?.let { raw ->
            runCatching { json.decodeFromString(RosterViewOptions.serializer(), raw) }.getOrDefault(RosterViewOptions())
        } ?: RosterViewOptions()
    }

    suspend fun saveRecentSeeds(seeds: List<String>) {
        context.appDataStore.edit { prefs ->
            prefs[RECENT_SEEDS] = json.encodeToString(ListSerializer(String.serializer()), seeds)
        }
    }

    suspend fun saveFavoriteSeeds(favorites: List<FavoriteSeed>) {
        context.appDataStore.edit { prefs ->
            prefs[FAVORITES] = json.encodeToString(ListSerializer(FavoriteSeed.serializer()), favorites)
        }
    }

    suspend fun saveActiveLocalGame(game: LocalPlayState?) {
        context.appDataStore.edit { prefs ->
            if (game == null) {
                prefs.remove(ACTIVE_LOCAL_GAME)
            } else {
                prefs[ACTIVE_LOCAL_GAME] = json.encodeToString(LocalPlayState.serializer(), game)
            }
        }
    }

    suspend fun saveLocalGameLibrary(library: LocalGameLibrary) {
        context.appDataStore.edit { prefs ->
            prefs[LOCAL_GAME_LIBRARY] = json.encodeToString(LocalGameLibrary.serializer(), library)
        }
    }

    suspend fun saveRosterViewOptions(options: RosterViewOptions) {
        context.appDataStore.edit { prefs ->
            prefs[ROSTER_VIEW_OPTIONS] = json.encodeToString(RosterViewOptions.serializer(), options)
        }
    }

    companion object {
        private val RECENT_SEEDS = stringPreferencesKey("recent_seeds")
        private val FAVORITES = stringPreferencesKey("favorite_seeds")
        private val ACTIVE_LOCAL_GAME = stringPreferencesKey("active_local_game")
        private val LOCAL_GAME_LIBRARY = stringPreferencesKey("local_game_library")
        private val ROSTER_VIEW_OPTIONS = stringPreferencesKey("roster_view_options")
    }
}
