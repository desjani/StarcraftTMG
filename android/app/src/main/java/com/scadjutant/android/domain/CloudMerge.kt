package com.scadjutant.android.domain

import com.scadjutant.android.model.FavoriteSeed
import com.scadjutant.android.model.LocalGameLibrary
import com.scadjutant.android.model.LocalPlayState

object CloudMerge {
    fun mergeRecentSeeds(local: List<String>, cloud: List<String>, max: Int = 10): List<String> {
        val merged = mutableListOf<String>()
        val seen = mutableSetOf<String>()
        for (seed in local + cloud) {
            val normalized = seed.trim().uppercase()
            if (normalized.isBlank() || !seen.add(normalized)) continue
            merged += normalized
            if (merged.size >= max) break
        }
        return merged
    }

    fun mergeFavorites(local: List<FavoriteSeed>, cloud: List<FavoriteSeed>): List<FavoriteSeed> {
        val merged = mutableListOf<FavoriteSeed>()
        val seen = mutableSetOf<String>()
        for (favorite in local + cloud) {
            val normalizedSeed = favorite.seed.trim().uppercase()
            if (normalizedSeed.isBlank() || !seen.add(normalizedSeed)) continue
            merged += favorite.copy(seed = normalizedSeed)
        }
        return merged
    }

    fun mergeLibrary(local: LocalGameLibrary, cloud: LocalGameLibrary): LocalGameLibrary {
        val inProgress = mergeGames(local.inProgress, cloud.inProgress)
        val completed = mergeGames(local.completed, cloud.completed)
        val filteredInProgress = inProgress.filterNot { game -> completed.any { it.gameId == game.gameId } }
        val activeGameId = listOfNotNull(local.activeGameId, cloud.activeGameId, filteredInProgress.firstOrNull()?.gameId)
            .firstOrNull { candidate -> filteredInProgress.any { it.gameId == candidate } }

        return LocalGameLibrary(
            activeGameId = activeGameId,
            inProgress = filteredInProgress,
            completed = completed,
        )
    }

    private fun mergeGames(local: List<LocalPlayState>, cloud: List<LocalPlayState>): List<LocalPlayState> {
        val map = linkedMapOf<String, LocalPlayState>()
        for (game in local + cloud) {
            val current = map[game.gameId]
            map[game.gameId] = if (current == null || game.updatedAt >= current.updatedAt) game else current
        }
        return map.values.sortedByDescending { it.updatedAt }
    }
}
