package com.scadjutant.android.domain

import com.scadjutant.android.model.LocalGameLibrary
import com.scadjutant.android.model.LocalPlayState
import com.scadjutant.android.model.ParsedRoster
import com.scadjutant.android.model.PlayActivation
import com.scadjutant.android.model.PlayHealthPool
import com.scadjutant.android.model.PlayPhases
import com.scadjutant.android.model.PlayUnitTracker
import java.time.Instant
import kotlin.math.max
import kotlin.math.min

object PlayStateFactory {
    fun createLocalGame(
        roster: ParsedRoster,
        playerName: String = "Player",
        opponentName: String = "Opponent",
        opponentRoster: ParsedRoster? = null,
        opponentFaction: String = "Terran",
        missionName: String = "Mission",
        gameLength: Int = 5,
        startingSupply: Int = 10,
        supplyPerRound: Int = 2,
        gameSize: Int = 2000,
    ): LocalPlayState {
        val now = Instant.now().toString()
        return LocalPlayState(
            gameId = createPlayGameId(),
            createdAt = now,
            updatedAt = now,
            playerSeed = roster.seed,
            playerRoster = roster,
            opponentSeed = opponentRoster?.seed,
            opponentRoster = opponentRoster,
            playerName = playerName.ifBlank { "Player" },
            opponentName = opponentName.ifBlank { "Opponent" },
            opponentFaction = opponentRoster?.faction ?: opponentFaction.ifBlank { "Terran" },
            missionName = missionName.ifBlank { "Mission" },
            gameLength = gameLength,
            startingSupply = startingSupply,
            supplyPerRound = supplyPerRound,
            gameSize = gameSize,
            hasStarted = true,
            unitsByKey = createUnitsByKey(roster, "player") + createUnitsByKey(opponentRoster, "opponent"),
        )
    }

    fun getCurrentPhase(state: LocalPlayState): String = PlayPhases.getOrElse(state.phaseIndex) { PlayPhases.first() }

    fun adjustTrackerHealth(state: LocalPlayState, unitKey: String, delta: Int): LocalPlayState {
        val tracker = state.unitsByKey[unitKey] ?: return state
        if (delta == 0 || tracker.currentHealthPools.isEmpty()) return state

        val current = tracker.currentHealthPools.toMutableList()
        val maxPools = tracker.maxHealthPools

        if (delta < 0) {
            repeat(-delta) {
                val targetIndex = current.indexOfFirst { it.type == "shield" && it.value > 0 }
                    .takeIf { it >= 0 }
                    ?: current.indexOfFirst { it.type == "hp" && it.value > 0 }
                if (targetIndex >= 0) {
                    val pool = current[targetIndex]
                    current[targetIndex] = pool.copy(value = max(0, pool.value - 1))
                }
            }
        } else {
            repeat(delta) {
                val damagedLivingModelIndex = current.indices.firstOrNull { index ->
                    current[index].type == "hp" && current[index].value in 1 until maxPools[index].value
                }
                val deadModelIndex = current.indices.firstOrNull { index ->
                    current[index].type == "hp" && current[index].value == 0 && maxPools[index].value > 0
                }
                val shieldIndex = current.indices.firstOrNull { index ->
                    current[index].type == "shield" && current[index].value < maxPools[index].value
                }
                val targetIndex = damagedLivingModelIndex ?: deadModelIndex ?: shieldIndex ?: -1
                if (targetIndex >= 0 && targetIndex < current.size) {
                    val pool = current[targetIndex]
                    current[targetIndex] = pool.copy(value = min(maxPools[targetIndex].value, pool.value + 1))
                }
            }
        }

        return state.withTracker(unitKey, tracker.copy(currentHealthPools = current, deployed = true))
    }

    fun toggleDeployed(state: LocalPlayState, unitKey: String): LocalPlayState {
        val tracker = state.unitsByKey[unitKey] ?: return state
        return state.withTracker(unitKey, tracker.copy(deployed = !tracker.deployed))
    }

    fun toggleActivation(state: LocalPlayState, unitKey: String, phaseKey: String): LocalPlayState {
        val tracker = state.unitsByKey[unitKey] ?: return state
        val nextActivation = when (phaseKey) {
            "movement" -> tracker.activation.copy(movement = !tracker.activation.movement)
            "assault" -> tracker.activation.copy(assault = !tracker.activation.assault)
            "combat" -> tracker.activation.copy(combat = !tracker.activation.combat)
            else -> tracker.activation
        }
        return state.withTracker(unitKey, tracker.copy(activation = nextActivation))
    }

    fun adjustScore(state: LocalPlayState, side: String, delta: Int): LocalPlayState = state.touch(
        if (side == "opponent") {
            state.copy(opponentScore = max(0, state.opponentScore + delta))
        } else {
            state.copy(playerScore = max(0, state.playerScore + delta))
        }
    )

    fun adjustResource(state: LocalPlayState, side: String, delta: Int): LocalPlayState = state.touch(
        if (side == "opponent") {
            state.copy(opponentResource = max(0, state.opponentResource + delta))
        } else {
            state.copy(playerResource = max(0, state.playerResource + delta))
        }
    )

    fun advancePhase(state: LocalPlayState): LocalPlayState {
        val nextPhaseIndex = state.phaseIndex + 1
        return if (nextPhaseIndex >= PlayPhases.size) {
            if (state.round >= state.gameLength) {
                state.touch(state.copy(completedAt = Instant.now().toString()))
            } else {
                state.touch(
                    state.copy(
                        round = state.round + 1,
                        phaseIndex = 0,
                        playerResource = 0,
                        opponentResource = 0,
                        unitsByKey = state.unitsByKey.mapValues { (_, tracker) ->
                            tracker.copy(activation = PlayActivation())
                        },
                    )
                )
            }
        } else {
            state.touch(state.copy(phaseIndex = nextPhaseIndex))
        }
    }

    fun totalCurrentHealth(tracker: PlayUnitTracker): Int = tracker.currentHealthPools.sumOf { it.value }

    fun totalMaxHealth(tracker: PlayUnitTracker): Int = tracker.maxHealthPools.sumOf { it.value }

    fun saveGameToLibrary(library: LocalGameLibrary, game: LocalPlayState): LocalGameLibrary {
        val nextInProgress = listOf(game) + library.inProgress.filterNot { it.gameId == game.gameId }
        return library.copy(
            activeGameId = game.gameId,
            inProgress = nextInProgress,
            completed = library.completed.filterNot { it.gameId == game.gameId },
        )
    }

    fun completeGame(library: LocalGameLibrary, game: LocalPlayState): LocalGameLibrary {
        val finished = game.copy(completedAt = Instant.now().toString())
        val nextCompleted = listOf(finished) + library.completed.filterNot { it.gameId == game.gameId }
        val nextInProgress = library.inProgress.filterNot { it.gameId == game.gameId }
        return library.copy(
            activeGameId = nextInProgress.firstOrNull()?.gameId,
            inProgress = nextInProgress,
            completed = nextCompleted.take(25),
        )
    }

    private fun createUnitsByKey(roster: ParsedRoster?, side: String): Map<String, PlayUnitTracker> {
        if (roster == null) return emptyMap()
        return roster.units.mapIndexed { index, unit ->
            val hpPerModel = unit.stats.hp.toIntOrNull() ?: 0
            val shield = unit.stats.shield?.toIntOrNull() ?: 0
            val pools = buildList {
                repeat(max(1, unit.models)) {
                    if (hpPerModel > 0) {
                        add(
                            PlayHealthPool(
                                label = if (unit.models > 1) "M${size + 1}" else "HP",
                                type = "hp",
                                value = hpPerModel,
                            )
                        )
                    }
                }
                if (shield > 0) {
                    add(
                        PlayHealthPool(
                            label = "SHD",
                            type = "shield",
                            value = shield,
                        )
                    )
                }
            }
            val key = "$side:${unit.id}-$index"
            key to PlayUnitTracker(
                key = key,
                side = side,
                label = buildString {
                    append(unit.name)
                    if (unit.models > 1) append(" ×${unit.models}")
                },
                supply = unit.supply,
                maxHealthPools = pools,
                currentHealthPools = pools,
            )
        }.toMap()
    }

    private fun createPlayGameId(): String =
        "play_${System.currentTimeMillis().toString(36)}_${(1000..9999).random()}"
}

private fun LocalPlayState.withTracker(unitKey: String, tracker: PlayUnitTracker): LocalPlayState =
    touch(copy(unitsByKey = unitsByKey + (unitKey to tracker)))

private fun LocalPlayState.touch(next: LocalPlayState): LocalPlayState =
    next.copy(updatedAt = Instant.now().toString())
