package com.scadjutant.android.model

import kotlinx.serialization.Serializable

@Serializable
data class ResourceUsage(
    val used: Int,
    val limit: Int,
)

@Serializable
data class SlotUsage(
    val used: Int,
    val avail: Int,
)

@Serializable
data class UnitStats(
    val hp: String,
    val armor: String,
    val evade: String,
    val speed: String,
    val shield: String?,
    val size: String,
)

@Serializable
data class RosterUpgrade(
    val name: String,
    val cost: Int,
    val activation: String,
    val phase: String,
    val description: String,
    val linkedTo: String,
    val active: Boolean = false,
)

@Serializable
data class TacticalAbility(
    val name: String,
    val text: String,
)

@Serializable
data class TacticalCardDetail(
    val id: String,
    val name: String,
    val slots: Map<String, Int>,
    val faction: String,
    val tags: String,
    val frontUrl: String,
    val isUnique: Boolean,
    val resource: Int?,
    val gasCost: Int?,
    val abilities: List<TacticalAbility>,
)

@Serializable
data class RosterUnit(
    val id: String,
    val name: String,
    val type: String,
    val size: String,
    val models: Int,
    val supply: Int,
    val baseCost: Int,
    val totalCost: Int,
    val activeUpgrades: List<RosterUpgrade>,
    val allUpgrades: List<RosterUpgrade>,
    val stats: UnitStats,
    val tags: String,
)

@Serializable
data class ParsedRoster(
    val seed: String,
    val createdAt: String?,
    val faction: String,
    val factionCard: String,
    val minerals: ResourceUsage,
    val gas: ResourceUsage,
    val supply: Int,
    val resources: Int,
    val slots: Map<String, SlotUsage>,
    val units: List<RosterUnit>,
    val tacticalCards: List<String>,
    val tacticalCardDetails: List<TacticalCardDetail>,
    val missionIds: List<String>,
)

val UnitTypeOrder = listOf("Hero", "Core", "Elite", "Support", "Air", "Other")

val TypeAbbreviation = mapOf(
    "Hero" to "H",
    "Core" to "C",
    "Elite" to "E",
    "Support" to "S",
    "Air" to "A",
    "Other" to "O",
)

val ResourceShort = mapOf(
    "Terran" to "cp",
    "Zerg" to "bm",
    "Protoss" to "pe",
)
