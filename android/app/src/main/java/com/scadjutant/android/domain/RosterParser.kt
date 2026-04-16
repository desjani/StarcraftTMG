package com.scadjutant.android.domain

import com.scadjutant.android.model.ParsedRoster
import com.scadjutant.android.model.ResourceUsage
import com.scadjutant.android.model.ResourceShort
import com.scadjutant.android.model.RosterUnit
import com.scadjutant.android.model.RosterUpgrade
import com.scadjutant.android.model.SlotUsage
import com.scadjutant.android.model.TacticalCardDetail
import com.scadjutant.android.model.UnitStats
import com.scadjutant.android.model.UnitTypeOrder

object RosterParser {
    fun parse(
        flat: Map<String, Any?>,
        tacticalCards: List<TacticalCardDetail> = emptyList(),
    ): ParsedRoster {
        val state = flat.mapValue("state")
        val tacticalById = tacticalCards.associateBy { it.id }

        val rawUnits = state.listValue("roster").map { rawUnit ->
            val unit = rawUnit.mapValue()
            val activeIndexes = unit.intList("activeUpgrades")
            val available = unit.listValue("availableUpgrades").map { it.mapValue() }

            val activeUpgrades = activeIndexes.mapNotNull { idx ->
                val upgrade = available.getOrNull(idx) ?: return@mapNotNull null
                val cost = if (unit.stringValue("size") == "large") {
                    upgrade.intValue("costL")
                } else {
                    upgrade.intValue("costS")
                }
                RosterUpgrade(
                    name = upgrade.stringValue("name"),
                    cost = cost,
                    activation = upgrade.stringValue("activation"),
                    phase = upgrade.stringValue("phase"),
                    description = upgrade.stringValue("description", upgrade.stringValue("text", upgrade.stringValue("rules"))),
                    linkedTo = upgrade.stringValue("linkedTo"),
                    active = true,
                )
            }

            val activeSet = activeIndexes.toSet()
            val allUpgrades = available.mapIndexed { idx, upgrade ->
                val cost = if (unit.stringValue("size") == "large") {
                    upgrade.intValue("costL")
                } else {
                    upgrade.intValue("costS")
                }
                RosterUpgrade(
                    name = upgrade.stringValue("name"),
                    cost = cost,
                    activation = upgrade.stringValue("activation"),
                    phase = upgrade.stringValue("phase"),
                    description = upgrade.stringValue("description", upgrade.stringValue("text", upgrade.stringValue("rules"))),
                    linkedTo = upgrade.stringValue("linkedTo"),
                    active = activeSet.contains(idx),
                )
            }

            val upgradeCost = activeUpgrades.sumOf { it.cost }
            RosterUnit(
                id = unit.stringValue("id"),
                name = unit.stringValue("name", unit.stringValue("id", "Unknown")),
                type = unit.stringValue("unitType", "Core"),
                size = unit.stringValue("size", "small"),
                models = unit.intValue("models", 1),
                supply = unit.intValue("supply"),
                baseCost = unit.intValue("baseCost"),
                totalCost = unit.intValue("baseCost") + upgradeCost,
                activeUpgrades = activeUpgrades.sortedWith(compareByDescending<RosterUpgrade> { it.cost }.thenBy { it.name.lowercase() }),
                allUpgrades = allUpgrades.sortedWith(compareByDescending<RosterUpgrade> { it.cost }.thenBy { it.name.lowercase() }),
                stats = UnitStats(
                    hp = unit.mapValue("stats").stringValue("hp", "-"),
                    armor = unit.mapValue("stats").stringValue("armor", "-"),
                    evade = unit.mapValue("stats").stringValue("evade", "-"),
                    speed = unit.mapValue("stats").stringValue("speed", "-"),
                    shield = unit.mapValue("stats").nullableString("shield"),
                    size = unit.mapValue("stats").stringValue("size", "-"),
                ),
                tags = unit.stringValue("tags"),
            )
        }.sortedBy { unit ->
            UnitTypeOrder.indexOf(unit.type).let { idx -> if (idx >= 0) idx else Int.MAX_VALUE }
        }

        val tacticalCardDetails = state.stringList("tacticalCardIds").map { id ->
            tacticalById[id] ?: TacticalCardDetail(
                id = id,
                name = idToTitle(id),
                slots = emptyMap(),
                faction = "",
                tags = "",
                frontUrl = "",
                isUnique = false,
                resource = null,
                gasCost = null,
                abilities = emptyList(),
            )
        }

        val slotsUsed = state.mapValue("slotsUsed")
        val slotsAvail = state.mapValue("slotsAvailable")
        val slotKeys = (slotsUsed.keys + slotsAvail.keys).distinct()

        return ParsedRoster(
            seed = flat.stringValue("id"),
            createdAt = flat.nullableString("createdAt"),
            faction = state.stringValue("faction", "Unknown"),
            factionCard = idToTitle(state.stringValue("factionCardId")),
            minerals = ResourceUsage(
                used = state.intValue("mineralsUsed"),
                limit = state.intValue("mineralsLimit", 1000),
            ),
            gas = ResourceUsage(
                used = state.intValue("gasUsed"),
                limit = state.intValue("gasLimit", 100),
            ),
            supply = state.intValue("supplyUsed"),
            resources = state.intValue("resourceTotal"),
            slots = slotKeys.associateWith { key ->
                SlotUsage(
                    used = slotsUsed.intValue(key),
                    avail = slotsAvail.intValue(key),
                )
            },
            units = rawUnits,
            tacticalCards = tacticalCardDetails.map { it.name },
            tacticalCardDetails = tacticalCardDetails.sortedBy { it.name.lowercase() },
            missionIds = state.stringList("missionIds").map(::idToTitle),
        )
    }

    fun resourceShortFor(faction: String): String = ResourceShort[faction] ?: "res"

    private fun idToTitle(id: String): String {
        val normalized = id.lowercase()
        return when (normalized) {
            "raynor_s_raiders" -> "Raynor's Raiders"
            "kerrigan_s_swarm" -> "Kerrigan's Swarm"
            else -> id.split('_').joinToString(" ") { token ->
                token.replaceFirstChar { ch -> ch.uppercase() }
            }
        }
    }
}

private fun Any?.mapValue(): Map<String, Any?> = this as? Map<String, Any?> ?: emptyMap()

private fun Map<String, Any?>.mapValue(key: String): Map<String, Any?> = this[key] as? Map<String, Any?> ?: emptyMap()

private fun Map<String, Any?>.listValue(key: String): List<Any?> = this[key] as? List<Any?> ?: emptyList()

private fun Map<String, Any?>.stringValue(key: String, default: String = ""): String = when (val value = this[key]) {
    null -> default
    is String -> value
    is Number -> value.toString()
    else -> value.toString()
}

private fun Map<String, Any?>.nullableString(key: String): String? = when (val value = this[key]) {
    null -> null
    is String -> value
    else -> value.toString()
}

private fun Map<String, Any?>.intValue(key: String, default: Int = 0): Int = when (val value = this[key]) {
    is Int -> value
    is Long -> value.toInt()
    is Double -> value.toInt()
    is Float -> value.toInt()
    is String -> value.toIntOrNull() ?: default
    else -> default
}

private fun Map<String, Any?>.intList(key: String): List<Int> = listValue(key).mapNotNull { value ->
    when (value) {
        is Int -> value
        is Long -> value.toInt()
        is Double -> value.toInt()
        is String -> value.toIntOrNull()
        else -> null
    }
}

private fun Map<String, Any?>.stringList(key: String): List<String> = listValue(key).mapNotNull { value ->
    when (value) {
        is String -> value
        else -> value?.toString()
    }
}
