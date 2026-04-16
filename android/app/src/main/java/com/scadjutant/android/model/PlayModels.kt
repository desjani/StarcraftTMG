package com.scadjutant.android.model

import kotlinx.serialization.Serializable

@Serializable
data class PlayHealthPool(
    val label: String = "",
    val type: String,
    val value: Int,
)

@Serializable
data class PlayActivation(
    val movement: Boolean = false,
    val assault: Boolean = false,
    val combat: Boolean = false,
)

@Serializable
data class PlayUnitTracker(
    val key: String,
    val side: String,
    val label: String = "",
    val supply: Int,
    val maxHealthPools: List<PlayHealthPool>,
    val currentHealthPools: List<PlayHealthPool>,
    val deployed: Boolean = false,
    val activation: PlayActivation = PlayActivation(),
)

@Serializable
data class LocalPlayState(
    val gameId: String,
    val createdAt: String,
    val updatedAt: String,
    val playerSeed: String,
    val playerRoster: ParsedRoster,
    val opponentSeed: String? = null,
    val opponentRoster: ParsedRoster? = null,
    val playerName: String = "Player",
    val opponentName: String = "Opponent",
    val opponentFaction: String = "Terran",
    val missionName: String = "Mission",
    val gameLength: Int = 5,
    val startingSupply: Int = 10,
    val supplyPerRound: Int = 2,
    val gameSize: Int = 2000,
    val hasStarted: Boolean = false,
    val completedAt: String? = null,
    val playerScore: Int = 0,
    val opponentScore: Int = 0,
    val playerResource: Int = 0,
    val opponentResource: Int = 0,
    val round: Int = 1,
    val phaseIndex: Int = 0,
    val firstPlayer: String = "player",
    val isLinkedGame: Boolean = false,
    val linkedReady: Boolean = false,
    val linkedMatchId: String? = null,
    val linkedSide: String? = null,
    val unitsByKey: Map<String, PlayUnitTracker> = emptyMap(),
)

val PlayPhases = listOf("Movement", "Assault", "Combat", "Scoring")
