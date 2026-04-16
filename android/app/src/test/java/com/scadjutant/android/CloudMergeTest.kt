package com.scadjutant.android

import com.scadjutant.android.domain.CloudMerge
import com.scadjutant.android.model.FavoriteSeed
import com.scadjutant.android.model.LocalGameLibrary
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class CloudMergeTest {

    @Test
    fun `recent seeds merge dedupes and preserves order`() {
        val merged = CloudMerge.mergeRecentSeeds(
            local = listOf("ABC123", "XYZ999"),
            cloud = listOf("xyz999", "LMN777"),
        )
        assertEquals(listOf("ABC123", "XYZ999", "LMN777"), merged)
    }

    @Test
    fun `favorites merge dedupes by seed`() {
        val merged = CloudMerge.mergeFavorites(
            local = listOf(FavoriteSeed("ABC123", "Alpha")),
            cloud = listOf(FavoriteSeed("abc123", "Cloud Alpha"), FavoriteSeed("ZZZ000", "Zulu")),
        )
        assertEquals(2, merged.size)
        assertEquals("ABC123", merged.first().seed)
    }

    @Test
    fun `empty libraries merge safely`() {
        val merged = CloudMerge.mergeLibrary(LocalGameLibrary(), LocalGameLibrary())
        assertTrue(merged.inProgress.isEmpty())
        assertTrue(merged.completed.isEmpty())
    }
}
