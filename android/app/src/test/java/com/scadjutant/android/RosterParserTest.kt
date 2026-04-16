package com.scadjutant.android

import com.scadjutant.android.domain.RosterParser
import com.scadjutant.android.model.TacticalAbility
import com.scadjutant.android.model.TacticalCardDetail
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class RosterParserTest {

    @Test
    fun `parse computes costs and unit ordering`() {
        val flat = mapOf(
            "id" to "TEST01",
            "createdAt" to "2026-04-14T00:00:00.000Z",
            "state" to mapOf(
                "faction" to "Protoss",
                "factionCardId" to "khalai",
                "mineralsUsed" to 1000,
                "mineralsLimit" to 1000,
                "gasUsed" to 100,
                "gasLimit" to 100,
                "supplyUsed" to 4,
                "resourceTotal" to 3,
                "slotsUsed" to mapOf("Hero" to 1, "Core" to 3),
                "slotsAvailable" to mapOf("Hero" to 1, "Core" to 8),
                "missionIds" to listOf("mission_hold_position"),
                "tacticalCardIds" to listOf("warp_gate"),
                "roster" to listOf(
                    mapOf(
                        "id" to "zealot",
                        "name" to "Zealot",
                        "unitType" to "Core",
                        "size" to "small",
                        "models" to 2,
                        "supply" to 3,
                        "baseCost" to 160,
                        "activeUpgrades" to listOf(1),
                        "availableUpgrades" to listOf(
                            mapOf("name" to "Charge", "costS" to 0, "costL" to 0),
                            mapOf("name" to "Leg Enhancements", "costS" to 20, "costL" to 40),
                        ),
                        "stats" to mapOf("hp" to "3", "armor" to "5+", "evade" to "-", "speed" to "6", "shield" to "1", "size" to "1"),
                    ),
                    mapOf(
                        "id" to "artanis",
                        "name" to "Artanis",
                        "unitType" to "Hero",
                        "size" to "small",
                        "models" to 1,
                        "supply" to 1,
                        "baseCost" to 250,
                        "activeUpgrades" to emptyList<Int>(),
                        "availableUpgrades" to emptyList<Map<String, Any?>>(),
                        "stats" to mapOf("hp" to "8", "armor" to "4+", "evade" to "5+", "speed" to "7", "shield" to "4", "size" to "2"),
                    ),
                ),
            ),
        )

        val tacticalCards = listOf(
            TacticalCardDetail(
                id = "warp_gate",
                name = "Warp Gate",
                slots = mapOf("Core" to 1),
                faction = "Protoss",
                tags = "",
                frontUrl = "",
                isUnique = false,
                resource = 1,
                gasCost = 25,
                abilities = listOf(TacticalAbility("Gate", "Deploy faster")),
            )
        )

        val roster = RosterParser.parse(flat, tacticalCards)

        assertEquals("TEST01", roster.seed)
        assertEquals("Protoss", roster.faction)
        assertEquals("Khalai", roster.factionCard)
        assertEquals(listOf("Hero", "Core"), roster.units.map { it.type })
        assertEquals(180, roster.units[1].totalCost)
        assertEquals("Warp Gate", roster.tacticalCards.first())
        assertTrue(roster.missionIds.contains("Mission Hold Position"))
    }

    @Test
    fun `resource short falls back safely`() {
        assertEquals("pe", RosterParser.resourceShortFor("Protoss"))
        assertEquals("res", RosterParser.resourceShortFor("Unknown"))
    }
}
