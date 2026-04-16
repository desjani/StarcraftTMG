package com.scadjutant.android.model

import kotlinx.serialization.Serializable

@Serializable
data class LocalGameLibrary(
    val activeGameId: String? = null,
    val inProgress: List<LocalPlayState> = emptyList(),
    val completed: List<LocalPlayState> = emptyList(),
)
