package com.scadjutant.android

import com.scadjutant.android.domain.PlayStateFactory
import com.scadjutant.android.model.LocalGameLibrary
import com.scadjutant.android.model.ParsedRoster
import com.scadjutant.android.model.ResourceUsage
import com.scadjutant.android.model.RosterUnit
import com.scadjutant.android.model.RosterUpgrade
import com.scadjutant.android.model.SlotUsage
import com.scadjutant.android.model.TacticalCardDetail
import com.scadjutant.android.model.UnitStats
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class PlayStateFactoryTest {

    @Test
    fun `create local game builds trackable units and advances phases`() {
        val roster = fixtureRoster()
        val game = PlayStateFactory.createLocalGame(roster)

        assertEquals("Movement", PlayStateFactory.getCurrentPhase(game))
        assertEquals(2, game.unitsByKey.size)

        val firstTracker = game.unitsByKey.values.first()
        val damaged = PlayStateFactory.adjustTrackerHealth(game, firstTracker.key, -2)
        assertEquals(
            PlayStateFactory.totalMaxHealth(firstTracker) - 2,
            PlayStateFactory.totalCurrentHealth(damaged.unitsByKey.getValue(firstTracker.key))
        )

        val moved = PlayStateFactory.toggleActivation(damaged, firstTracker.key, "movement")
        assertTrue(moved.unitsByKey.getValue(firstTracker.key).activation.movement)

        val nextPhase = PlayStateFactory.advancePhase(moved)
        assertEquals("Assault", PlayStateFactory.getCurrentPhase(nextPhase))
    }

    @Test
    fun `scoring rollover resets activation and increases round`() {
        val roster = fixtureRoster()
        var game = PlayStateFactory.createLocalGame(roster)
        val trackerKey = game.unitsByKey.keys.first()
        game = PlayStateFactory.toggleActivation(game, trackerKey, "movement")
        repeat(4) {
            game = PlayStateFactory.advancePhase(game)
        }

        assertEquals(2, game.round)
        assertEquals("Movement", PlayStateFactory.getCurrentPhase(game))
        assertFalse(game.unitsByKey.getValue(trackerKey).activation.movement)
    }

    @Test
    fun `final scoring completes the game at the round cap`() {
        val roster = fixtureRoster()
        var game = PlayStateFactory.createLocalGame(roster, gameLength = 1)

        repeat(4) {
            game = PlayStateFactory.advancePhase(game)
        }

        assertNotNull(game.completedAt)
        assertEquals(1, game.round)
    }

    @Test
    fun `damage uses shield first and healing restores models before shield`() {
        val roster = fixtureRoster()
        val game = PlayStateFactory.createLocalGame(roster)
        val trackerKey = game.unitsByKey.keys.last()

        val onceDamaged = PlayStateFactory.adjustTrackerHealth(game, trackerKey, -1)
        assertEquals(listOf(4, 1), onceDamaged.unitsByKey.getValue(trackerKey).currentHealthPools.map { it.value })

        val twiceDamaged = PlayStateFactory.adjustTrackerHealth(onceDamaged, trackerKey, -1)
        assertEquals(listOf(4, 0), twiceDamaged.unitsByKey.getValue(trackerKey).currentHealthPools.map { it.value })

        val woundedModel = PlayStateFactory.adjustTrackerHealth(twiceDamaged, trackerKey, -1)
        assertEquals(listOf(3, 0), woundedModel.unitsByKey.getValue(trackerKey).currentHealthPools.map { it.value })

        val healed = PlayStateFactory.adjustTrackerHealth(woundedModel, trackerKey, 1)
        assertEquals(listOf(4, 0), healed.unitsByKey.getValue(trackerKey).currentHealthPools.map { it.value })

        val shieldRecovered = PlayStateFactory.adjustTrackerHealth(healed, trackerKey, 1)
        assertEquals(listOf(4, 1), shieldRecovered.unitsByKey.getValue(trackerKey).currentHealthPools.map { it.value })
    }

    @Test
    fun `create local game stores opponent roster metadata when available`() {
        val roster = fixtureRoster()
        val opponent = fixtureRoster().copy(seed = "OPP001", faction = "Terran", factionCard = "Raynor")

        val game = PlayStateFactory.createLocalGame(
            roster = roster,
            opponentRoster = opponent,
            opponentFaction = "Ignored",
        )

        assertEquals("OPP001", game.opponentSeed)
        assertEquals("Terran", game.opponentFaction)
        assertEquals("Raynor", game.opponentRoster?.factionCard)
    }

    @Test
    fun `saving and completing a game updates library buckets`() {
        val roster = fixtureRoster()
        val game = PlayStateFactory.createLocalGame(roster)
        val saved = PlayStateFactory.saveGameToLibrary(LocalGameLibrary(), game)

        assertEquals(game.gameId, saved.activeGameId)
        assertEquals(1, saved.inProgress.size)

        val completed = PlayStateFactory.completeGame(saved, game)
        assertNull(completed.activeGameId)
        assertEquals(0, completed.inProgress.size)
        assertEquals(1, completed.completed.size)
    }

    private fun fixtureRoster(): ParsedRoster = ParsedRoster(
        seed = "TEST01",
        createdAt = null,
        faction = "Protoss",
        factionCard = "Khalai",
        minerals = ResourceUsage(1000, 1000),
        gas = ResourceUsage(100, 100),
        supply = 4,
        resources = 3,
        slots = mapOf("Core" to SlotUsage(3, 8)),
        units = listOf(
            RosterUnit(
                id = "zealot",
                name = "Zealot",
                type = "Core",
                size = "small",
                models = 2,
                supply = 3,
                baseCost = 160,
                totalCost = 180,
                activeUpgrades = listOf(RosterUpgrade("Charge", 20, "", "", "", "", true)),
                allUpgrades = emptyList(),
                stats = UnitStats("3", "5+", "-", "6", "1", "1"),
                tags = "",
            ),
            RosterUnit(
                id = "stalker",
                name = "Stalker",
                type = "Elite",
                size = "large",
                models = 1,
                supply = 1,
                baseCost = 160,
                totalCost = 160,
                activeUpgrades = emptyList(),
                allUpgrades = emptyList(),
                stats = UnitStats("4", "4+", "5+", "6", "2", "2"),
                tags = "",
            )
        ),
        tacticalCards = listOf("Warp Gate"),
        tacticalCardDetails = emptyList<TacticalCardDetail>(),
        missionIds = emptyList(),
    )
}
