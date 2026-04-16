package com.scadjutant.android.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val LightScheme = lightColorScheme(
    primary = Color(0xFF7FB6FF),
    onPrimary = Color(0xFFFFFFFF),
    secondary = Color(0xFF45F2FF),
    onSecondary = Color(0xFF062333),
    tertiary = Color(0xFFF1BF59),
    background = Color(0xFF0B111C),
    surface = Color(0xFF111A29),
    surfaceVariant = Color(0xFF182334),
    onSurface = Color(0xFFE6EDF7),
)

private val DarkScheme = darkColorScheme(
    primary = Color(0xFF7FB6FF),
    onPrimary = Color(0xFF06233D),
    secondary = Color(0xFF45F2FF),
    onSecondary = Color(0xFF062333),
    tertiary = Color(0xFFF1BF59),
    background = Color(0xFF0B111C),
    surface = Color(0xFF111A29),
    surfaceVariant = Color(0xFF182334),
    onSurface = Color(0xFFE6EDF7),
)

@Composable
fun ScAdjutantTheme(
    darkTheme: Boolean = true,
    content: @Composable () -> Unit,
) {
    MaterialTheme(
        colorScheme = if (darkTheme) DarkScheme else LightScheme,
        typography = ScAdjutantTypography,
        content = content,
    )
}
