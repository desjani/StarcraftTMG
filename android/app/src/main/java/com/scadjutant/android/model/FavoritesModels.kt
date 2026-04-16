package com.scadjutant.android.model

import kotlinx.serialization.Serializable

@Serializable
data class FavoriteSeed(
    val seed: String,
    val name: String,
)
