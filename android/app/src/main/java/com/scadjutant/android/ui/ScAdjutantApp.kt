@file:OptIn(androidx.compose.foundation.layout.ExperimentalLayoutApi::class)

package com.scadjutant.android.ui

import android.app.Activity
import android.graphics.Canvas
import android.content.Intent
import android.content.Context
import android.content.ContextWrapper
import android.graphics.Bitmap
import android.view.View
import android.view.ViewGroup
import android.view.View.MeasureSpec
import android.widget.Toast
import androidx.compose.animation.animateContentSize
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectVerticalDragGestures
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawingPadding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.AutoAwesome
import androidx.compose.material.icons.rounded.Casino
import androidx.compose.material.icons.rounded.Delete
import androidx.compose.material.icons.rounded.DragHandle
import androidx.compose.material.icons.rounded.Edit
import androidx.compose.material.icons.rounded.Favorite
import androidx.compose.material.icons.rounded.History
import androidx.compose.material.icons.rounded.Menu
import androidx.compose.material.icons.rounded.Save
import androidx.compose.material.icons.rounded.Settings
import androidx.compose.material.icons.rounded.Share
import androidx.compose.material.icons.rounded.Shield
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.AssistChip
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CenterAlignedTopAppBar
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCompositionContext
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.core.content.FileProvider
import androidx.compose.ui.platform.ComposeView
import androidx.activity.ComponentActivity
import androidx.lifecycle.setViewTreeLifecycleOwner
import androidx.lifecycle.setViewTreeViewModelStoreOwner
import androidx.savedstate.setViewTreeSavedStateRegistryOwner
import com.scadjutant.android.AppTab
import com.scadjutant.android.MainViewModel
import com.scadjutant.android.PlaySetupState
import com.scadjutant.android.PlayerAidOptions
import com.scadjutant.android.RosterViewOptions
import com.scadjutant.android.domain.RosterParser
import com.scadjutant.android.domain.PlayStateFactory
import com.scadjutant.android.model.FavoriteSeed
import com.scadjutant.android.model.LocalGameLibrary
import com.scadjutant.android.model.LocalPlayState
import com.scadjutant.android.model.ParsedRoster
import com.scadjutant.android.model.PlayUnitTracker
import com.scadjutant.android.model.ResourceShort
import com.scadjutant.android.model.RosterUnit
import com.scadjutant.android.model.TypeAbbreviation
import com.scadjutant.android.ui.theme.OrbitronFontFamily
import com.scadjutant.android.ui.theme.ScAdjutantTheme
import java.io.File
import java.io.FileOutputStream
import kotlin.math.roundToInt

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ScAdjutantApp(viewModel: MainViewModel) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    var showNavMenu by remember { mutableStateOf(false) }

    Scaffold(
        modifier = Modifier.safeDrawingPadding(),
        topBar = {
            CenterAlignedTopAppBar(
                navigationIcon = {
                    Box {
                        IconButton(onClick = { showNavMenu = true }) {
                            Icon(
                                imageVector = Icons.Rounded.Menu,
                                contentDescription = "Open navigation",
                            )
                        }
                        DropdownMenu(
                            expanded = showNavMenu,
                            onDismissRequest = { showNavMenu = false },
                        ) {
                            AppTab.entries.forEach { tab ->
                                DropdownMenuItem(
                                    text = {
                                        Text(
                                            text = tab.label,
                                            color = if (uiState.selectedTab == tab) {
                                                MaterialTheme.colorScheme.primary
                                            } else {
                                                MaterialTheme.colorScheme.onSurface
                                            },
                                        )
                                    },
                                    onClick = {
                                        showNavMenu = false
                                        viewModel.selectTab(tab)
                                    },
                                )
                            }
                        }
                    }
                },
                title = {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("SC Adjutant")
                        Text(
                            text = uiState.selectedTab.label,
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                },
            )
        },
    ) { padding ->
        Surface(modifier = Modifier.fillMaxSize()) {
            when (uiState.selectedTab) {
                AppTab.LIBRARY -> LibraryScreen(
                    modifier = Modifier.padding(padding),
                    seedInput = uiState.seedInput,
                    isLoading = uiState.isLoading,
                    errorMessage = uiState.errorMessage,
                    roster = uiState.currentRoster,
                    recentSeeds = uiState.recentSeeds,
                    favorites = uiState.favoriteSeeds,
                    onSeedChange = viewModel::updateSeedInput,
                    onLoad = { viewModel.loadRoster() },
                    onLoadRecent = viewModel::loadRoster,
                    onLoadFavorite = viewModel::loadFavorite,
                    onSaveFavorite = viewModel::saveCurrentRosterToFavorites,
                    onRenameFavorite = viewModel::renameFavorite,
                    onDeleteFavorite = viewModel::deleteFavorite,
                    onMoveFavorite = viewModel::moveFavorite,
                )
                AppTab.ROSTER -> RosterScreen(
                    modifier = Modifier.padding(padding),
                    roster = uiState.currentRoster,
                    options = uiState.rosterOptions,
                    onOptionsChanged = { update -> viewModel.toggleRosterOption(update) },
                )
                AppTab.AID -> PlayerAidScreen(
                    modifier = Modifier.padding(padding),
                    roster = uiState.currentRoster,
                    options = uiState.playerAidOptions,
                    sections = viewModel.unitSectionsForAid(uiState.currentRoster),
                    onOptionsChanged = { update -> viewModel.toggleAidOption(update) },
                )
                AppTab.PLAY -> PlayScreen(
                    modifier = Modifier.padding(padding),
                    roster = uiState.currentRoster,
                    game = uiState.activeLocalGame,
                    gameLibrary = uiState.localGameLibrary,
                    cloudSignedIn = uiState.cloudUserId != null,
                    showSetup = uiState.showNewGameSetup,
                    showLinkedCreateSetup = uiState.showLinkedCreateSetup,
                    showLinkedJoinSetup = uiState.showLinkedJoinSetup,
                    playSetup = uiState.playSetup,
                    playSetupError = uiState.playSetupError,
                    isCreatingLocalGame = uiState.isCreatingLocalGame,
                    linkedJoinCode = uiState.linkedJoinCode,
                    linkedSyncStatus = uiState.linkedSyncStatus,
                    isLinkedBusy = uiState.isLinkedBusy,
                    onStartLocalGame = viewModel::openNewGameSetup,
                    onStartLinkedCreate = viewModel::openLinkedCreateSetup,
                    onStartLinkedJoin = viewModel::openLinkedJoinSetup,
                    onConfirmLocalGame = viewModel::startLocalGame,
                    onConfirmLinkedCreate = viewModel::createLinkedGame,
                    onConfirmLinkedJoin = viewModel::joinLinkedGame,
                    onCancelSetup = viewModel::closeNewGameSetup,
                    onUpdateSetup = viewModel::updatePlaySetup,
                    onUpdateJoinCode = viewModel::updateLinkedJoinCode,
                    onRestoreGame = viewModel::restoreLocalGame,
                    onClearGame = viewModel::clearLocalGame,
                    onAdvancePhase = viewModel::advancePlayPhase,
                    onAdjustScore = viewModel::adjustPlayScore,
                    onAdjustResource = viewModel::adjustPlayResource,
                    onToggleUnitDeployment = viewModel::toggleUnitDeployment,
                    onToggleUnitActivation = viewModel::toggleUnitActivation,
                    onAdjustUnitHealth = viewModel::adjustUnitHealth,
                )
                AppTab.SETTINGS -> SettingsScreen(
                    modifier = Modifier.padding(padding),
                    cloudUserId = uiState.cloudUserId,
                    cloudStatus = uiState.cloudStatus,
                    cloudProviderLabel = uiState.cloudProviderLabel,
                    cloudDisplayName = uiState.cloudDisplayName,
                    cloudEmail = uiState.cloudEmail,
                    isGoogleSignInConfigured = uiState.isGoogleSignInConfigured,
                    isCloudBusy = uiState.isCloudBusy,
                    favoriteCount = uiState.favoriteSeeds.size,
                    recentSeedCount = uiState.recentSeeds.size,
                    gameCount = uiState.localGameLibrary.inProgress.size + uiState.localGameLibrary.completed.size,
                    onSignInGoogle = viewModel::signInCloudWithGoogle,
                    onSignInCloud = viewModel::signInCloudAnonymously,
                    onSignOutCloud = viewModel::signOutCloud,
                    onSyncNow = viewModel::syncCloudNow,
                )
            }
        }
    }
}

private val AppTab.label: String
    get() = when (this) {
        AppTab.LIBRARY -> "Library"
        AppTab.ROSTER -> "Roster"
        AppTab.AID -> "Aid"
        AppTab.PLAY -> "Play"
        AppTab.SETTINGS -> "Settings"
    }

@Composable
private fun LibraryScreen(
    modifier: Modifier = Modifier,
    seedInput: String,
    isLoading: Boolean,
    errorMessage: String?,
    roster: ParsedRoster?,
    recentSeeds: List<String>,
    favorites: List<FavoriteSeed>,
    onSeedChange: (String) -> Unit,
    onLoad: () -> Unit,
    onLoadRecent: (String) -> Unit,
    onLoadFavorite: (String) -> Unit,
    onSaveFavorite: (String) -> Unit,
    onRenameFavorite: (String, String) -> Unit,
    onDeleteFavorite: (String) -> Unit,
    onMoveFavorite: (String, Int) -> Unit,
) {
    val favoriteNames = favorites.associate { it.seed to it.name }
    val currentRosterName = roster?.let { favoriteNames[it.seed] ?: "${it.factionCard} (${it.seed})" }.orEmpty()
    var favoriteDraft by rememberSaveable(currentRosterName) { mutableStateOf(currentRosterName) }
    var editingFavoriteSeed by rememberSaveable { mutableStateOf<String?>(null) }
    var editingFavoriteName by rememberSaveable { mutableStateOf("") }
    var favoritesEditMode by rememberSaveable { mutableStateOf(false) }

    LazyColumn(
        modifier = modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        item {
            WireCard {
                Column(
                    modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                ) {
                    Text("Load Roster", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
                    OutlinedTextField(
                        value = seedInput,
                        onValueChange = onSeedChange,
                        singleLine = true,
                        label = { Text("Seed code") },
                        supportingText = { Text("Enter a shared roster seed from the Army Builder.") },
                        modifier = Modifier.fillMaxWidth(),
                    )
                    Button(onClick = onLoad, enabled = !isLoading, modifier = Modifier.fillMaxWidth()) {
                        if (isLoading) {
                            CircularProgressIndicator(modifier = Modifier.height(18.dp))
                        } else {
                            Text("Load roster")
                        }
                    }
                    if (errorMessage != null) {
                        Text(
                            text = errorMessage,
                            color = MaterialTheme.colorScheme.error,
                            style = MaterialTheme.typography.bodyMedium,
                        )
                    }
                }
            }
        }

        if (roster != null) {
            item {
                WireCard {
                    Column(
                        modifier = Modifier.padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp),
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Column(modifier = Modifier.fillMaxWidth(0.64f)) {
                                Text("Actions", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
                                Text(
                                    "Save this roster into your favorites library with a custom name.",
                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                                )
                            }
                            Icon(
                                imageVector = Icons.Rounded.Favorite,
                                contentDescription = null,
                                tint = factionAccent(roster.faction),
                            )
                        }
                        OutlinedTextField(
                            value = favoriteDraft,
                            onValueChange = { favoriteDraft = it },
                            label = { Text("Favorite name") },
                            supportingText = { Text("How this roster appears in your library.") },
                            modifier = Modifier.fillMaxWidth(),
                        )
                        Button(
                            onClick = { onSaveFavorite(favoriteDraft) },
                            modifier = Modifier.fillMaxWidth(),
                        ) {
                            Text("Save to favorites")
                        }
                    }
                }
            }
        }

        item {
            LibrarySectionCard(
                title = "History",
                icon = { Icon(Icons.Rounded.History, contentDescription = null, tint = MaterialTheme.colorScheme.secondary) },
                emptyText = "No recent seeds yet.",
                isEmpty = recentSeeds.isEmpty(),
            ) {
                FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    recentSeeds.forEach { seed ->
                        SeedPill(label = seed, onClick = { onLoadRecent(seed) })
                    }
                }
            }
        }

        item {
            LibrarySectionCard(
                title = "Favorites",
                icon = { Icon(Icons.Rounded.Favorite, contentDescription = null, tint = factionAccent(roster?.faction)) },
                emptyText = "No favorites saved yet.",
                isEmpty = favorites.isEmpty(),
                headerActions = {
                    if (favorites.isNotEmpty()) {
                        IconButton(onClick = {
                            favoritesEditMode = !favoritesEditMode
                            if (!favoritesEditMode) editingFavoriteSeed = null
                        }) {
                            Icon(
                                imageVector = Icons.Rounded.Edit,
                                contentDescription = if (favoritesEditMode) "Done editing favorites" else "Edit favorites",
                                tint = if (favoritesEditMode) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant,
                            )
                        }
                    }
                },
            ) {
                favorites.forEachIndexed { index, favorite ->
                    WireCard {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .then(
                                    if (!favoritesEditMode) {
                                        Modifier.clickable { onLoadFavorite(favorite.seed) }
                                    } else {
                                        Modifier
                                    }
                                )
                                .padding(12.dp),
                            verticalArrangement = Arrangement.spacedBy(10.dp),
                        ) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically,
                            ) {
                                Column(modifier = Modifier.fillMaxWidth(0.7f)) {
                                    Text(favorite.name, style = MaterialTheme.typography.titleSmall, maxLines = 1, overflow = TextOverflow.Ellipsis)
                                    Text(
                                        favorite.seed,
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                                    )
                                }
                                if (favoritesEditMode) {
                                    Row {
                                        DragHandleButton(
                                            onMoveUp = { onMoveFavorite(favorite.seed, -1) },
                                            onMoveDown = { onMoveFavorite(favorite.seed, 1) },
                                            canMoveUp = index > 0,
                                            canMoveDown = index < favorites.lastIndex,
                                        )
                                        IconButton(onClick = {
                                            editingFavoriteSeed = favorite.seed
                                            editingFavoriteName = favorite.name
                                        }) {
                                            Icon(Icons.Rounded.Edit, contentDescription = "Rename favorite")
                                        }
                                        IconButton(onClick = { onDeleteFavorite(favorite.seed) }) {
                                            Icon(Icons.Rounded.Delete, contentDescription = "Delete favorite")
                                        }
                                    }
                                }
                            }
                            if (favoritesEditMode && editingFavoriteSeed == favorite.seed) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                                    verticalAlignment = Alignment.CenterVertically,
                                ) {
                                    OutlinedTextField(
                                        value = editingFavoriteName,
                                        onValueChange = { editingFavoriteName = it },
                                        label = { Text("Rename favorite") },
                                        singleLine = true,
                                        modifier = Modifier.fillMaxWidth(0.78f),
                                    )
                                    IconButton(onClick = {
                                        onRenameFavorite(favorite.seed, editingFavoriteName)
                                        editingFavoriteSeed = null
                                    }) {
                                        Icon(Icons.Rounded.Save, contentDescription = "Save favorite name")
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun RosterScreen(
    modifier: Modifier = Modifier,
    roster: ParsedRoster?,
    options: RosterViewOptions,
    onOptionsChanged: ((RosterViewOptions) -> RosterViewOptions) -> Unit,
) {
    var showOptions by rememberSaveable { mutableStateOf(false) }
    val context = LocalContext.current
    val localView = LocalView.current
    val parentComposition = rememberCompositionContext()

    if (roster == null) {
        EmptyState(
            modifier = modifier,
            title = "No roster loaded",
            body = "Open Library from the menu, load a seed, then come back here for the full card.",
        )
        return
    }

    LazyColumn(
        modifier = modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        item {
            RosterSummaryCard(
                roster = roster,
                options = options,
                showOptions = showOptions,
                onToggleOptions = { showOptions = !showOptions },
                onOptionsChanged = onOptionsChanged,
                onShare = { shareRosterCard(context, localView, parentComposition, roster, options, roster.seed) },
            )
        }
    }
}

@Composable
private fun RosterOptionPanel(
    options: RosterViewOptions,
    onOptionsChanged: ((RosterViewOptions) -> RosterViewOptions) -> Unit,
) {
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        OptionGroup(title = "Show/Hide") {
            ToggleChip("Supply Slots", options.showSlots) { onOptionsChanged { it.copy(showSlots = !it.showSlots) } }
            ToggleChip("Tac Cards", options.showTactical) { onOptionsChanged { it.copy(showTactical = !it.showTactical) } }
        }
        OptionGroup(title = "Units") {
            ToggleChip("Stats", options.showStats) { onOptionsChanged { it.copy(showStats = !it.showStats) } }
            ToggleChip("Upgrades", options.showUpgrades) { onOptionsChanged { it.copy(showUpgrades = !it.showUpgrades) } }
            ToggleChip("Size", options.showSize) { onOptionsChanged { it.copy(showSize = !it.showSize) } }
            ToggleChip("Cost", options.showCost) { onOptionsChanged { it.copy(showCost = !it.showCost) } }
        }
        OptionGroup(title = "Tac Cards") {
            ToggleChip("Slots", options.showTacticalSupply) { onOptionsChanged { it.copy(showTacticalSupply = !it.showTacticalSupply) } }
            ToggleChip("Faction Resource", options.showTacticalResource) { onOptionsChanged { it.copy(showTacticalResource = !it.showTacticalResource) } }
            ToggleChip("Cost", options.showTacticalGas) { onOptionsChanged { it.copy(showTacticalGas = !it.showTacticalGas) } }
        }
    }
}

@Composable
private fun RosterSummaryCard(
    roster: ParsedRoster,
    options: RosterViewOptions,
    showOptions: Boolean,
    onToggleOptions: () -> Unit,
    onOptionsChanged: ((RosterViewOptions) -> RosterViewOptions) -> Unit,
    onShare: () -> Unit,
    showToolbar: Boolean = true,
) {
    val headerBrush = factionBrush(roster.faction)

    Card(
        colors = CardDefaults.cardColors(containerColor = Color.Transparent),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.5f)),
        shape = RoundedCornerShape(16.dp),
    ) {
        Column(
            modifier = Modifier
                .background(headerBrush)
                .fillMaxWidth(),
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(18.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(0.82f),
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Text(
                            text = roster.faction.uppercase(),
                            style = MaterialTheme.typography.headlineSmall,
                            fontWeight = FontWeight.Bold,
                            color = factionAccent(roster.faction),
                            fontFamily = OrbitronFontFamily,
                        )
                        Text(
                            text = "· ${roster.factionCard.uppercase()}",
                            style = MaterialTheme.typography.titleMedium,
                            color = factionAccent(roster.faction),
                            fontFamily = OrbitronFontFamily,
                            fontWeight = FontWeight.SemiBold,
                        )
                    }
                    if (showToolbar) {
                        Row {
                            IconButton(onClick = onShare) {
                                Icon(
                                    imageVector = Icons.Rounded.Share,
                                    contentDescription = "Share roster card",
                                    tint = MaterialTheme.colorScheme.onSurfaceVariant,
                                )
                            }
                            IconButton(onClick = onToggleOptions) {
                                Icon(
                                    imageVector = Icons.Rounded.Settings,
                                    contentDescription = if (showOptions) "Hide roster options" else "Show roster options",
                                    tint = MaterialTheme.colorScheme.onSurfaceVariant,
                                )
                            }
                        }
                    }
                }
                if (showToolbar && showOptions) {
                    WireCard(
                        modifier = Modifier
                            .fillMaxWidth()
                            .animateContentSize(),
                    ) {
                        Column(
                            modifier = Modifier.padding(12.dp),
                            verticalArrangement = Arrangement.spacedBy(10.dp),
                        ) {
                            RosterOptionPanel(
                                options = options,
                                onOptionsChanged = onOptionsChanged,
                            )
                        }
                    }
                }
                FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    MetaPill("${roster.minerals.used}/${roster.minerals.limit}m", accent = WebRosterColors.Yellow)
                    MetaPill("${roster.gas.used}/${roster.gas.limit}g", accent = WebRosterColors.Yellow)
                    MetaPill("${roster.supply}sup", accent = WebRosterColors.Red)
                    MetaPill("${roster.resources}${resourceIconForFaction(roster.faction)}", accent = factionAccent(roster.faction))
                    MetaPill(roster.seed, accent = MaterialTheme.colorScheme.primary)
                }
                val visibleSlots = roster.slots.entries.filter { (_, value) ->
                    value.used > 0 || value.avail > 0
                }
                if (options.showSlots && visibleSlots.isNotEmpty()) {
                    FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        visibleSlots.forEach { (key, value) ->
                            MetaPill(
                                label = "${TypeAbbreviation[key] ?: key.firstOrNull() ?: '?'}:${value.used}/${value.avail}",
                                accent = slotAccent(key),
                            )
                        }
                    }
                }
            }

            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color(0xCC0E1624))
            ) {
                roster.units.forEach { unit ->
                    UnitRow(unit = unit, options = options)
                }
            }

            if (options.showTactical && roster.tacticalCardDetails.isNotEmpty()) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(Color(0xB30B111C))
                        .padding(horizontal = 18.dp, vertical = 14.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp),
                ) {
                    Text(
                        "TAC CARDS",
                        style = MaterialTheme.typography.labelLarge,
                        color = MaterialTheme.colorScheme.tertiary,
                        fontWeight = FontWeight.Bold,
                    )
                    FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        roster.tacticalCardDetails.forEach { card ->
                            val extras = buildList {
                                if (options.showTacticalSupply && card.slots.isNotEmpty()) {
                                    add(card.slots.entries.joinToString("") { (key, value) ->
                                        "${TypeAbbreviation[key] ?: key.firstOrNull() ?: '?'}".repeat(value)
                                    })
                                }
                            }
                            TacticalCardPill(
                                name = card.name,
                                slotLetters = if (options.showTacticalSupply) extras.firstOrNull().orEmpty() else "",
                                resource = if (options.showTacticalResource) card.resource else null,
                                gasCost = if (options.showTacticalGas) card.gasCost else null,
                                faction = roster.faction,
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun OptionGroup(
    title: String,
    content: @Composable () -> Unit,
) {
    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
        Text(
            title,
            style = MaterialTheme.typography.labelMedium,
            color = MaterialTheme.colorScheme.tertiary,
            fontWeight = FontWeight.SemiBold,
        )
        FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            content()
        }
    }
}

@Composable
private fun ToggleChip(
    label: String,
    selected: Boolean,
    onClick: () -> Unit,
) {
    FilterChip(
        selected = selected,
        onClick = onClick,
        label = {
            Text(
                label,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
                style = MaterialTheme.typography.labelSmall,
            )
        },
        border = BorderStroke(
            width = 1.dp,
            color = if (selected) MaterialTheme.colorScheme.secondary else MaterialTheme.colorScheme.outline.copy(alpha = 0.5f),
        ),
    )
}

@Composable
private fun UnitRow(
    unit: RosterUnit,
    options: RosterViewOptions,
) {
    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .background(Color.Transparent)
                .padding(horizontal = 18.dp, vertical = 12.dp),
            horizontalArrangement = Arrangement.spacedBy(10.dp),
            verticalAlignment = Alignment.Top,
        ) {
            TypeBadge(type = unit.type)
            Column(modifier = Modifier.fillMaxWidth(0.65f)) {
                FlowRow(
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                    verticalArrangement = Arrangement.spacedBy(4.dp),
                ) {
                    Text(
                        text = buildString {
                            append(unit.name)
                            if (unit.models > 1) append(" ×${unit.models}")
                        },
                        style = MaterialTheme.typography.titleSmall,
                        color = MaterialTheme.colorScheme.onSurface,
                    )
                    if (options.showSize) {
                        InlineMetaText(unit.size, color = WebRosterColors.Muted)
                    }
                    InlineMetaText("${unit.supply}◆", color = WebRosterColors.Red)
                    if (options.showCost) {
                        InlineMetaText("${unit.totalCost}m", color = WebRosterColors.Yellow)
                    }
                }
            }
        }
        if (options.showUpgrades && unit.activeUpgrades.any { it.cost > 0 }) {
            FlowRow(
                modifier = Modifier.padding(horizontal = 18.dp),
                horizontalArrangement = Arrangement.spacedBy(6.dp),
                verticalArrangement = Arrangement.spacedBy(6.dp),
            ) {
                unit.activeUpgrades.filter { it.cost > 0 }.forEach { upgrade ->
                    UpgradePill(label = "+ ${upgrade.name}", cost = "${upgrade.cost}m")
                }
            }
        }
        if (options.showStats) {
            Text(
                text = "HP ${unit.stats.hp}  ARM ${unit.stats.armor}  EVA ${unit.stats.evade}  SPD ${unit.stats.speed}" +
                    (unit.stats.shield?.let { "  SHD $it" } ?: ""),
                style = MaterialTheme.typography.bodySmall,
                color = WebRosterColors.Muted,
                modifier = Modifier.padding(horizontal = 18.dp),
                fontFamily = OrbitronFontFamily,
            )
        }
        HorizontalDivider(color = MaterialTheme.colorScheme.outline.copy(alpha = 0.22f))
    }
}

@Composable
private fun LibrarySectionCard(
    title: String,
    icon: @Composable () -> Unit,
    emptyText: String,
    isEmpty: Boolean,
    headerActions: (@Composable () -> Unit)? = null,
    content: @Composable () -> Unit,
) {
    WireCard {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Row(horizontalArrangement = Arrangement.spacedBy(10.dp), verticalAlignment = Alignment.CenterVertically) {
                    icon()
                    Text(title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
                }
                headerActions?.invoke()
            }
            if (isEmpty) {
                Text(
                    emptyText,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            } else {
                content()
            }
        }
    }
}

@Composable
private fun WireCard(
    modifier: Modifier = Modifier,
    content: @Composable () -> Unit,
) {
    Card(
        modifier = modifier,
        colors = CardDefaults.cardColors(containerColor = Color(0xCC111A29)),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.45f)),
        shape = RoundedCornerShape(16.dp),
    ) {
        content()
    }
}

@Composable
private fun SeedPill(
    label: String,
    onClick: () -> Unit,
) {
    AssistChip(
        onClick = onClick,
        label = { Text(label) },
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.5f)),
        shape = RoundedCornerShape(999.dp),
    )
}

@Composable
private fun TypeBadge(type: String) {
    val accent = slotAccent(type)
    Box(
        modifier = Modifier
            .background(accent.copy(alpha = 0.14f), RoundedCornerShape(6.dp))
            .padding(horizontal = 8.dp, vertical = 4.dp),
        contentAlignment = Alignment.Center,
    ) {
        Text(
            text = TypeAbbreviation[type] ?: "?",
            style = MaterialTheme.typography.labelMedium,
            color = accent,
            fontWeight = FontWeight.Bold,
        )
    }
}

@Composable
private fun UpgradePill(
    label: String,
    cost: String,
) {
    Box(
        modifier = Modifier
            .background(Color(0x1846D48A), RoundedCornerShape(999.dp))
            .padding(horizontal = 10.dp, vertical = 4.dp),
    ) {
        Row(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalAlignment = Alignment.CenterVertically) {
            Text(label, style = MaterialTheme.typography.bodySmall, color = WebRosterColors.Green)
            Text(cost, style = MaterialTheme.typography.bodySmall, color = WebRosterColors.Yellow, fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
private fun DragHandleButton(
    onMoveUp: () -> Unit,
    onMoveDown: () -> Unit,
    canMoveUp: Boolean,
    canMoveDown: Boolean,
) {
    var dragDelta by remember { mutableStateOf(0f) }
    Icon(
        imageVector = Icons.Rounded.DragHandle,
        contentDescription = "Drag to reorder favorite",
        tint = MaterialTheme.colorScheme.onSurfaceVariant,
        modifier = Modifier
            .padding(horizontal = 4.dp, vertical = 8.dp)
            .pointerInput(canMoveUp, canMoveDown) {
                detectVerticalDragGestures(
                    onVerticalDrag = { _, dragAmount ->
                        dragDelta += dragAmount
                        if (dragDelta <= -36f && canMoveUp) {
                            onMoveUp()
                            dragDelta = 0f
                        } else if (dragDelta >= 36f && canMoveDown) {
                            onMoveDown()
                            dragDelta = 0f
                        }
                    },
                    onDragEnd = { dragDelta = 0f },
                    onDragCancel = { dragDelta = 0f },
                )
            },
    )
}

private fun shareRosterCard(
    context: Context,
    sourceView: View,
    parentComposition: androidx.compose.runtime.CompositionContext,
    roster: ParsedRoster,
    options: RosterViewOptions,
    seed: String,
) {
    val activity = context.findActivity() as? ComponentActivity
    if (activity == null) {
        Toast.makeText(
            context,
            "Unable to share the roster card right now.",
            Toast.LENGTH_LONG,
        ).show()
        return
    }

    val rootView = activity.window?.decorView as? ViewGroup
    if (rootView == null) {
        Toast.makeText(context, "Unable to prepare the share image.", Toast.LENGTH_LONG).show()
        return
    }

    val composeView = ComposeView(context).apply {
        setParentCompositionContext(parentComposition)
        setViewTreeLifecycleOwner(activity)
        setViewTreeViewModelStoreOwner(activity)
        setViewTreeSavedStateRegistryOwner(activity)
        alpha = 0f
        setContent {
            ScAdjutantTheme {
                Box(
                    modifier = Modifier
                        .background(MaterialTheme.colorScheme.background)
                        .padding(16.dp)
                ) {
                    RosterSummaryCard(
                        roster = roster,
                        options = options,
                        showOptions = false,
                        onToggleOptions = {},
                        onOptionsChanged = {},
                        onShare = {},
                        showToolbar = false,
                    )
                }
            }
        }
    }

    val targetWidth = sourceView.width.takeIf { it > 0 }
        ?: rootView.width.takeIf { it > 0 }
        ?: context.resources.displayMetrics.widthPixels

    rootView.addView(
        composeView,
        ViewGroup.LayoutParams(targetWidth, ViewGroup.LayoutParams.WRAP_CONTENT),
    )

    composeView.post {
        runCatching {
            val widthSpec = MeasureSpec.makeMeasureSpec(targetWidth.coerceAtLeast(1), MeasureSpec.EXACTLY)
            val heightSpec = MeasureSpec.makeMeasureSpec(0, MeasureSpec.UNSPECIFIED)
            composeView.measure(widthSpec, heightSpec)
            val measuredWidth = composeView.measuredWidth.coerceAtLeast(1)
            val measuredHeight = composeView.measuredHeight.coerceAtLeast(1)
            composeView.layout(0, 0, measuredWidth, measuredHeight)
            val bitmap = Bitmap.createBitmap(
                measuredWidth,
                measuredHeight,
                Bitmap.Config.ARGB_8888,
            )
            val canvas = Canvas(bitmap)
            composeView.draw(canvas)

            val shareDir = File(context.cacheDir, "shared_images").apply { mkdirs() }
            val outputFile = File(shareDir, "roster-$seed.png")
            FileOutputStream(outputFile).use { stream ->
                bitmap.compress(Bitmap.CompressFormat.PNG, 100, stream)
            }
            val uri = FileProvider.getUriForFile(context, "${context.packageName}.fileprovider", outputFile)
            val shareIntent = Intent(Intent.ACTION_SEND).apply {
                type = "image/png"
                putExtra(Intent.EXTRA_STREAM, uri)
                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            }
            activity.startActivity(Intent.createChooser(shareIntent, "Share roster card"))
        }.onFailure { error ->
            Toast.makeText(
                context,
                error.message ?: "Unable to share the roster card right now.",
                Toast.LENGTH_LONG,
            ).show()
        }

        rootView.removeView(composeView)
    }
}

@Composable
private fun TacticalCardPill(
    name: String,
    slotLetters: String,
    resource: Int?,
    gasCost: Int?,
    faction: String,
) {
    Box(
        modifier = Modifier
            .background(Color(0xFF142234), RoundedCornerShape(999.dp))
            .padding(horizontal = 10.dp, vertical = 5.dp),
    ) {
        FlowRow(
            horizontalArrangement = Arrangement.spacedBy(6.dp),
            verticalArrangement = Arrangement.spacedBy(4.dp),
        ) {
            Text(name, style = MaterialTheme.typography.bodySmall, color = WebRosterColors.Muted)
            if (slotLetters.isNotBlank()) {
                Row(horizontalArrangement = Arrangement.spacedBy(0.dp), verticalAlignment = Alignment.CenterVertically) {
                    Text("[", style = MaterialTheme.typography.bodySmall, color = WebRosterColors.Muted)
                    slotLetters.forEach { letter ->
                        val accent = slotAccentForAbbreviation(letter)
                        Text(
                            letter.toString(),
                            style = MaterialTheme.typography.bodySmall,
                            color = accent,
                            fontFamily = OrbitronFontFamily,
                            fontWeight = FontWeight.Bold,
                        )
                    }
                    Text("]", style = MaterialTheme.typography.bodySmall, color = WebRosterColors.Muted)
                }
            }
            if (resource != null) {
                Text(
                    "${resource}${resourceIconForFaction(faction)}",
                    style = MaterialTheme.typography.bodySmall,
                    color = factionAccent(faction),
                    fontWeight = FontWeight.SemiBold,
                )
            }
            if (gasCost != null) {
                Text(
                    "${gasCost}g",
                    style = MaterialTheme.typography.bodySmall,
                    color = WebRosterColors.Yellow,
                    fontWeight = FontWeight.SemiBold,
                )
            }
        }
    }
}

@Composable
private fun MetaPill(
    label: String,
    accent: Color = MaterialTheme.colorScheme.onSurface,
) {
    Box(
        modifier = Modifier
            .background(accent.copy(alpha = 0.12f), RoundedCornerShape(999.dp))
            .padding(horizontal = 10.dp, vertical = 4.dp),
    ) {
        Text(label, style = MaterialTheme.typography.bodySmall, color = accent)
    }
}

@Composable
private fun InlineMetaText(
    label: String,
    color: Color,
) {
    Text(
        text = label,
        style = MaterialTheme.typography.bodySmall,
        color = color,
        fontFamily = OrbitronFontFamily,
    )
}

private object WebRosterColors {
    val Terran = Color(0xFF7DB4FF)
    val Protoss = Color(0xFFF1BF59)
    val Zerg = Color(0xFFF76DB2)
    val Yellow = Color(0xFFF1BF59)
    val Green = Color(0xFF46D48A)
    val Cyan = Color(0xFF45F2FF)
    val Red = Color(0xFFFF626B)
    val Muted = Color(0xFF93A8C4)
}

private fun resourceIconForFaction(faction: String?): String = when (faction?.lowercase()) {
    "terran" -> "▣"
    "zerg" -> "◉"
    else -> "✦"
}

private fun factionAccent(faction: String?): Color = when (faction?.lowercase()) {
    "terran" -> WebRosterColors.Terran
    "zerg" -> WebRosterColors.Zerg
    else -> WebRosterColors.Protoss
}

private fun slotAccentForAbbreviation(letter: Char): Color = when (letter.uppercaseChar()) {
    'H' -> WebRosterColors.Yellow
    'C' -> WebRosterColors.Cyan
    'E' -> WebRosterColors.Red
    'S' -> WebRosterColors.Green
    'A' -> WebRosterColors.Protoss
    else -> WebRosterColors.Muted
}

private fun slotAccent(type: String?): Color = when (type) {
    "Hero" -> WebRosterColors.Yellow
    "Core" -> WebRosterColors.Cyan
    "Elite" -> WebRosterColors.Red
    "Support" -> WebRosterColors.Green
    "Air" -> WebRosterColors.Protoss
    else -> WebRosterColors.Muted
}

private fun factionBrush(faction: String?): Brush = when (faction?.lowercase()) {
    "terran" -> Brush.verticalGradient(listOf(Color(0xFF16263F), Color(0xFF0D1624)))
    "zerg" -> Brush.verticalGradient(listOf(Color(0xFF2E162C), Color(0xFF111221)))
    else -> Brush.verticalGradient(listOf(Color(0xFF302513), Color(0xFF17120C)))
}

@Composable
private fun PlayerAidScreen(
    modifier: Modifier = Modifier,
    roster: ParsedRoster?,
    options: PlayerAidOptions,
    sections: Map<String, List<RosterUnit>>,
    onOptionsChanged: ((PlayerAidOptions) -> PlayerAidOptions) -> Unit,
) {
    if (roster == null) {
        EmptyState(
            modifier = modifier,
            title = "No roster loaded",
            body = "Load a roster first, then this tab becomes the native Player Aid view.",
        )
        return
    }

    LazyColumn(
        modifier = modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        item {
            Card {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Text("Player Aid", style = MaterialTheme.typography.titleMedium)
                    FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        ToggleChip("Stats", options.showStats) { onOptionsChanged { it.copy(showStats = !it.showStats) } }
                        ToggleChip("All upgrades", options.showAllUpgrades) { onOptionsChanged { it.copy(showAllUpgrades = !it.showAllUpgrades) } }
                        ToggleChip("Activation", options.showActivation) { onOptionsChanged { it.copy(showActivation = !it.showActivation) } }
                        ToggleChip("Tactical", options.showTactical) { onOptionsChanged { it.copy(showTactical = !it.showTactical) } }
                    }
                }
            }
        }
        item {
            Card {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text("${roster.faction} · ${roster.factionCard}", style = MaterialTheme.typography.headlineSmall)
                    Text("Seed ${roster.seed}", color = MaterialTheme.colorScheme.onSurfaceVariant)
                    if (options.showTactical && roster.tacticalCardDetails.isNotEmpty()) {
                        Text("Tactical: ${roster.tacticalCardDetails.joinToString(", ") { it.name }}")
                    }
                }
            }
        }
        sections.forEach { (type, units) ->
            item {
                Text(type, style = MaterialTheme.typography.titleLarge)
            }
            itemsIndexed(units, key = { index, unit -> "$type-${unit.id}-${unit.name}-${unit.totalCost}-$index" }) { _, unit ->
                Card {
                    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Text(
                            text = buildString {
                                append(unit.name)
                                if (unit.models > 1) append(" ×${unit.models}")
                            },
                            style = MaterialTheme.typography.titleMedium,
                        )
                        Text(
                            text = "${unit.supply} supply · ${unit.totalCost} minerals · ${unit.size}",
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                        if (options.showStats) {
                            Text(
                                text = buildString {
                                    append("HP ${unit.stats.hp}")
                                    unit.stats.shield?.let { append(" · Shield $it") }
                                    append("\nArmor ${unit.stats.armor} · Evade ${unit.stats.evade} · Speed ${unit.stats.speed}")
                                },
                            )
                        }
                        if (options.showActivation) {
                            val activationLines = unit.allUpgrades
                                .filter { it.activation.isNotBlank() }
                                .takeIf { it.isNotEmpty() }
                                ?.joinToString("\n") { "${it.phase}: ${it.name} ${it.activation.replace('\n', ' ')}" }
                            if (activationLines != null) {
                                Text(activationLines, style = MaterialTheme.typography.bodySmall)
                            }
                        }
                        val upgrades = if (options.showAllUpgrades) unit.allUpgrades else unit.activeUpgrades
                        if (upgrades.isNotEmpty()) {
                            Text(
                                text = upgrades.joinToString("\n") { upgrade ->
                                    buildString {
                                        append(upgrade.name)
                                        if (upgrade.cost > 0) append(" (+${upgrade.cost}m)")
                                        if (upgrade.description.isNotBlank()) append(": ${upgrade.description}")
                                    }
                                },
                                style = MaterialTheme.typography.bodySmall,
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun PlayScreen(
    modifier: Modifier = Modifier,
    roster: ParsedRoster?,
    game: LocalPlayState?,
    gameLibrary: LocalGameLibrary,
    cloudSignedIn: Boolean,
    showSetup: Boolean,
    showLinkedCreateSetup: Boolean,
    showLinkedJoinSetup: Boolean,
    playSetup: PlaySetupState,
    playSetupError: String?,
    isCreatingLocalGame: Boolean,
    linkedJoinCode: String,
    linkedSyncStatus: String?,
    isLinkedBusy: Boolean,
    onStartLocalGame: () -> Unit,
    onStartLinkedCreate: () -> Unit,
    onStartLinkedJoin: () -> Unit,
    onConfirmLocalGame: () -> Unit,
    onConfirmLinkedCreate: () -> Unit,
    onConfirmLinkedJoin: () -> Unit,
    onCancelSetup: () -> Unit,
    onUpdateSetup: ((PlaySetupState) -> PlaySetupState) -> Unit,
    onUpdateJoinCode: (String) -> Unit,
    onRestoreGame: (String) -> Unit,
    onClearGame: () -> Unit,
    onAdvancePhase: () -> Unit,
    onAdjustScore: (String, Int) -> Unit,
    onAdjustResource: (String, Int) -> Unit,
    onToggleUnitDeployment: (String) -> Unit,
    onToggleUnitActivation: (String, String) -> Unit,
    onAdjustUnitHealth: (String, Int) -> Unit,
) {
    LazyColumn(
        modifier = modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        item {
            Card {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Icon(Icons.Rounded.Shield, contentDescription = null)
                        Text("Play Mode foundation", style = MaterialTheme.typography.titleLarge)
                    }
                    Text(
                        "This phase adds a local game tracker with round/phase, score, resources, deployment, activation, and health.",
                    )
                    if (linkedSyncStatus != null) {
                        Text(linkedSyncStatus, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                    if (roster != null) {
                        FlowRow(horizontalArrangement = Arrangement.spacedBy(12.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                            Button(onClick = onStartLocalGame) {
                                Text(if (game == null) "Create Local Game" else "Create Another Game")
                            }
                            if (cloudSignedIn) {
                                Button(onClick = onStartLinkedCreate) {
                                    Text("Create Linked Game")
                                }
                                Button(onClick = onStartLinkedJoin) {
                                    Text("Join Linked Game")
                                }
                            }
                        }
                    } else if (!cloudSignedIn) {
                        Text("Sign in and load a roster to use linked multiplayer.", color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                    if (game != null) {
                        Text("Active game: ${game.playerRoster.factionCard} · Round ${game.round}/${game.gameLength} · ${PlayStateFactory.getCurrentPhase(game)}")
                    } else if (roster != null) {
                        Text("Current loaded roster: ${roster.seed} · ${roster.factionCard}")
                    } else {
                        Text("Load a roster first so Play setup can use it later.")
                    }
                }
            }
        }

        if (showSetup && roster != null) {
            item {
                LocalGameSetupCard(
                    setup = playSetup,
                    roster = roster,
                    errorMessage = playSetupError,
                    isCreating = isCreatingLocalGame,
                    onUpdateSetup = onUpdateSetup,
                    onConfirm = onConfirmLocalGame,
                    onCancel = onCancelSetup,
                )
            }
        }

        if (showLinkedCreateSetup && roster != null) {
            item {
                LinkedCreateSetupCard(
                    setup = playSetup,
                    roster = roster,
                    errorMessage = playSetupError,
                    isBusy = isLinkedBusy,
                    onUpdateSetup = onUpdateSetup,
                    onConfirm = onConfirmLinkedCreate,
                    onCancel = onCancelSetup,
                )
            }
        }

        if (showLinkedJoinSetup && roster != null) {
            item {
                LinkedJoinSetupCard(
                    setup = playSetup,
                    roster = roster,
                    joinCode = linkedJoinCode,
                    errorMessage = playSetupError,
                    isBusy = isLinkedBusy,
                    onUpdateSetup = onUpdateSetup,
                    onUpdateJoinCode = onUpdateJoinCode,
                    onConfirm = onConfirmLinkedJoin,
                    onCancel = onCancelSetup,
                )
            }
        }

        if (game != null) {
            item {
                Card {
                    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        Text("${game.playerName} vs ${game.opponentName}", style = MaterialTheme.typography.titleLarge)
                        Text("Mission: ${game.missionName}")
                        Text("Round ${game.round}/${game.gameLength} · ${PlayStateFactory.getCurrentPhase(game)}")
                        Text(
                            buildString {
                                append("Player ${game.playerRoster.factionCard}")
                                game.opponentRoster?.let { append(" · Opponent ${it.factionCard}") }
                                game.opponentSeed?.let { append(" · Seed $it") }
                                if (game.isLinkedGame) {
                                    append(" · Linked ${game.linkedMatchId ?: ""} (${game.linkedSide ?: "player"})")
                                }
                            },
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                        Row(horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = Alignment.CenterVertically) {
                            Button(onClick = onAdvancePhase) { Text("Advance Phase") }
                            Button(onClick = onClearGame) { Text("End Local Game") }
                        }
                    }
                }
            }
            item {
                ScoreboardCard(
                    game = game,
                    linkedSide = game.linkedSide,
                    isLinkedGame = game.isLinkedGame,
                    onAdjustScore = onAdjustScore,
                    onAdjustResource = onAdjustResource,
                )
            }
            item {
                Text("Unit trackers", style = MaterialTheme.typography.titleLarge)
            }
            items(game.unitsByKey.values.toList(), key = { it.key }) { tracker ->
                Card {
                    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Text(tracker.label, style = MaterialTheme.typography.titleMedium)
                        Text(
                            text = "Supply ${tracker.supply} · Health ${trackerHealthDisplay(tracker)}",
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                        FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            ToggleChip(
                                label = if (tracker.deployed) "Deployed" else "Reserve",
                                selected = tracker.deployed,
                                onClick = { if (!game.isLinkedGame || tracker.side == (game.linkedSide ?: "player")) onToggleUnitDeployment(tracker.key) },
                            )
                            ToggleChip("Move", tracker.activation.movement) { if (!game.isLinkedGame || tracker.side == (game.linkedSide ?: "player")) onToggleUnitActivation(tracker.key, "movement") }
                            ToggleChip("Assault", tracker.activation.assault) { if (!game.isLinkedGame || tracker.side == (game.linkedSide ?: "player")) onToggleUnitActivation(tracker.key, "assault") }
                            ToggleChip("Combat", tracker.activation.combat) { if (!game.isLinkedGame || tracker.side == (game.linkedSide ?: "player")) onToggleUnitActivation(tracker.key, "combat") }
                        }
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                            Button(
                                onClick = { onAdjustUnitHealth(tracker.key, -1) },
                                enabled = !game.isLinkedGame || tracker.side == (game.linkedSide ?: "player"),
                            ) { Text("Damage") }
                            Button(
                                onClick = { onAdjustUnitHealth(tracker.key, 1) },
                                enabled = !game.isLinkedGame || tracker.side == (game.linkedSide ?: "player"),
                            ) { Text("Heal") }
                        }
                    }
                }
            }
        }

        if (gameLibrary.inProgress.isNotEmpty() || gameLibrary.completed.isNotEmpty()) {
            item {
                Text("Game library", style = MaterialTheme.typography.titleLarge)
            }
            if (gameLibrary.inProgress.isNotEmpty()) {
                item {
                    Text("In progress", style = MaterialTheme.typography.titleMedium)
                }
                items(gameLibrary.inProgress, key = { it.gameId }) { savedGame ->
                    GameLibraryRow(
                        game = savedGame,
                        actionLabel = if (game?.gameId == savedGame.gameId) "Active" else "Resume",
                        onAction = if (game?.gameId == savedGame.gameId) null else ({ onRestoreGame(savedGame.gameId) }),
                    )
                }
            }
            if (gameLibrary.completed.isNotEmpty()) {
                item {
                    Text("Completed", style = MaterialTheme.typography.titleMedium)
                }
                items(gameLibrary.completed, key = { "${it.gameId}-done" }) { savedGame ->
                    GameLibraryRow(
                        game = savedGame,
                        actionLabel = "Completed",
                        onAction = null,
                    )
                }
            }
        }
    }
}

@Composable
private fun LinkedCreateSetupCard(
    setup: PlaySetupState,
    roster: ParsedRoster,
    errorMessage: String?,
    isBusy: Boolean,
    onUpdateSetup: ((PlaySetupState) -> PlaySetupState) -> Unit,
    onConfirm: () -> Unit,
    onCancel: () -> Unit,
) {
    Card {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Text("Create linked game", style = MaterialTheme.typography.titleLarge)
            Text("Your side uses loaded roster ${roster.seed} · ${roster.factionCard}")
            OutlinedTextField(
                value = setup.playerName,
                onValueChange = { onUpdateSetup { state -> state.copy(playerName = it) } },
                label = { Text("Your display name") },
                modifier = Modifier.fillMaxWidth(),
            )
            OutlinedTextField(
                value = setup.missionName,
                onValueChange = { onUpdateSetup { state -> state.copy(missionName = it) } },
                label = { Text("Mission") },
                modifier = Modifier.fillMaxWidth(),
            )
            SetupNumberField("Game length", setup.gameLength) { onUpdateSetup { state -> state.copy(gameLength = it) } }
            SetupNumberField("Starting supply", setup.startingSupply) { onUpdateSetup { state -> state.copy(startingSupply = it) } }
            SetupNumberField("Supply per round", setup.supplyPerRound) { onUpdateSetup { state -> state.copy(supplyPerRound = it) } }
            SetupNumberField("Game size", setup.gameSize) { onUpdateSetup { state -> state.copy(gameSize = it) } }
            if (errorMessage != null) {
                Text(errorMessage, color = MaterialTheme.colorScheme.error)
            }
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                Button(onClick = onConfirm, enabled = !isBusy) { Text(if (isBusy) "Creating..." else "Create Linked Game") }
                Button(onClick = onCancel, enabled = !isBusy) { Text("Cancel") }
            }
        }
    }
}

@Composable
private fun LinkedJoinSetupCard(
    setup: PlaySetupState,
    roster: ParsedRoster,
    joinCode: String,
    errorMessage: String?,
    isBusy: Boolean,
    onUpdateSetup: ((PlaySetupState) -> PlaySetupState) -> Unit,
    onUpdateJoinCode: (String) -> Unit,
    onConfirm: () -> Unit,
    onCancel: () -> Unit,
) {
    Card {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Text("Join linked game", style = MaterialTheme.typography.titleLarge)
            Text("You will join using loaded roster ${roster.seed} · ${roster.factionCard}")
            OutlinedTextField(
                value = joinCode,
                onValueChange = onUpdateJoinCode,
                label = { Text("Match code") },
                modifier = Modifier.fillMaxWidth(),
            )
            OutlinedTextField(
                value = setup.playerName,
                onValueChange = { onUpdateSetup { state -> state.copy(playerName = it) } },
                label = { Text("Your display name") },
                modifier = Modifier.fillMaxWidth(),
            )
            if (errorMessage != null) {
                Text(errorMessage, color = MaterialTheme.colorScheme.error)
            }
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                Button(onClick = onConfirm, enabled = !isBusy) { Text(if (isBusy) "Joining..." else "Join Linked Game") }
                Button(onClick = onCancel, enabled = !isBusy) { Text("Cancel") }
            }
        }
    }
}

@Composable
private fun LocalGameSetupCard(
    setup: PlaySetupState,
    roster: ParsedRoster,
    errorMessage: String?,
    isCreating: Boolean,
    onUpdateSetup: ((PlaySetupState) -> PlaySetupState) -> Unit,
    onConfirm: () -> Unit,
    onCancel: () -> Unit,
) {
    Card {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Text("Local game setup", style = MaterialTheme.typography.titleLarge)
            Text("Using roster ${roster.seed} · ${roster.factionCard}")
            OutlinedTextField(
                value = setup.playerName,
                onValueChange = { onUpdateSetup { state -> state.copy(playerName = it) } },
                label = { Text("Player name") },
                modifier = Modifier.fillMaxWidth(),
            )
            OutlinedTextField(
                value = setup.opponentName,
                onValueChange = { onUpdateSetup { state -> state.copy(opponentName = it) } },
                label = { Text("Opponent name") },
                modifier = Modifier.fillMaxWidth(),
            )
            OutlinedTextField(
                value = setup.opponentSeed,
                onValueChange = { onUpdateSetup { state -> state.copy(opponentSeed = it.uppercase().take(8)) } },
                label = { Text("Opponent seed") },
                supportingText = { Text("Optional. If provided, the opponent faction is pulled from that roster.") },
                modifier = Modifier.fillMaxWidth(),
            )
            OutlinedTextField(
                value = setup.missionName,
                onValueChange = { onUpdateSetup { state -> state.copy(missionName = it) } },
                label = { Text("Mission") },
                modifier = Modifier.fillMaxWidth(),
            )
            SetupNumberField("Game length", setup.gameLength) { onUpdateSetup { state -> state.copy(gameLength = it) } }
            SetupNumberField("Starting supply", setup.startingSupply) { onUpdateSetup { state -> state.copy(startingSupply = it) } }
            SetupNumberField("Supply per round", setup.supplyPerRound) { onUpdateSetup { state -> state.copy(supplyPerRound = it) } }
            SetupNumberField("Game size", setup.gameSize) { onUpdateSetup { state -> state.copy(gameSize = it) } }
            if (errorMessage != null) {
                Text(
                    text = errorMessage,
                    color = MaterialTheme.colorScheme.error,
                    style = MaterialTheme.typography.bodyMedium,
                )
            }
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                Button(onClick = onConfirm, enabled = !isCreating) {
                    Text(if (isCreating) "Loading..." else "Create Game")
                }
                Button(onClick = onCancel) { Text("Cancel") }
            }
        }
    }
}

@Composable
private fun SetupNumberField(
    label: String,
    value: String,
    onChange: (String) -> Unit,
) {
    OutlinedTextField(
        value = value,
        onValueChange = onChange,
        label = { Text(label) },
        singleLine = true,
        modifier = Modifier.fillMaxWidth(),
    )
}

@Composable
private fun GameLibraryRow(
    game: LocalPlayState,
    actionLabel: String,
    onAction: (() -> Unit)?,
) {
    Card {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Column(modifier = Modifier.fillMaxWidth(0.65f)) {
                Text("${game.playerName} vs ${game.opponentName}", style = MaterialTheme.typography.titleMedium)
                Text(
                    "${game.playerRoster.factionCard} · Round ${game.round}/${game.gameLength} · ${game.missionName}",
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
            if (onAction != null) {
                Button(onClick = onAction) {
                    Text(actionLabel)
                }
            } else {
                Text(actionLabel, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
        }
    }
}

private fun trackerHealthDisplay(tracker: PlayUnitTracker): String =
    tracker.currentHealthPools.joinToString("/") { it.value.toString() }

@Composable
private fun ScoreboardCard(
    game: LocalPlayState,
    linkedSide: String?,
    isLinkedGame: Boolean,
    onAdjustScore: (String, Int) -> Unit,
    onAdjustResource: (String, Int) -> Unit,
) {
    Card {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
            Text("Scoreboard", style = MaterialTheme.typography.titleLarge)
            SideScoreRow(
                title = game.playerName,
                score = game.playerScore,
                resource = game.playerResource,
                editable = !isLinkedGame || linkedSide == "player",
                onAdjustScore = { onAdjustScore("player", it) },
                onAdjustResource = { onAdjustResource("player", it) },
            )
            HorizontalDivider()
            SideScoreRow(
                title = game.opponentName,
                score = game.opponentScore,
                resource = game.opponentResource,
                editable = !isLinkedGame || linkedSide == "opponent",
                onAdjustScore = { onAdjustScore("opponent", it) },
                onAdjustResource = { onAdjustResource("opponent", it) },
            )
        }
    }
}

@Composable
private fun SideScoreRow(
    title: String,
    score: Int,
    resource: Int,
    editable: Boolean,
    onAdjustScore: (Int) -> Unit,
    onAdjustResource: (Int) -> Unit,
) {
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text(title, style = MaterialTheme.typography.titleMedium)
        Text("Score $score · Resource $resource")
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
            Button(onClick = { onAdjustScore(-1) }, enabled = editable) { Text("Score -") }
            Button(onClick = { onAdjustScore(1) }, enabled = editable) { Text("Score +") }
            Button(onClick = { onAdjustResource(-1) }, enabled = editable) { Text("Res -") }
            Button(onClick = { onAdjustResource(1) }, enabled = editable) { Text("Res +") }
        }
    }
}

@Composable
private fun SettingsScreen(
    modifier: Modifier = Modifier,
    cloudUserId: String?,
    cloudStatus: String,
    cloudProviderLabel: String?,
    cloudDisplayName: String?,
    cloudEmail: String?,
    isGoogleSignInConfigured: Boolean,
    isCloudBusy: Boolean,
    favoriteCount: Int,
    recentSeedCount: Int,
    gameCount: Int,
    onSignInGoogle: (Activity) -> Unit,
    onSignInCloud: () -> Unit,
    onSignOutCloud: () -> Unit,
    onSyncNow: () -> Unit,
) {
    val activity = LocalContext.current.findActivity()

    LazyColumn(
        modifier = modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        item {
            Card {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("Settings", style = MaterialTheme.typography.titleLarge)
                    Text("Project phase: local alpha + cloud foundation")
                    Text("Cloud status: $cloudStatus")
                    cloudProviderLabel?.let {
                        Text("Sign-in method: $it")
                    }
                    cloudDisplayName?.let {
                        Text("Account name: $it")
                    }
                    cloudEmail?.let {
                        Text("Account email: $it")
                    }
                    if (cloudUserId != null) {
                        Text("Cloud user: $cloudUserId")
                    }
                    Text(
                        "Local data ready to sync: $favoriteCount favorites · $recentSeedCount recent seeds · $gameCount saved games",
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                    FlowRow(horizontalArrangement = Arrangement.spacedBy(12.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        if (cloudUserId == null) {
                            if (isGoogleSignInConfigured && activity != null) {
                                Button(onClick = { onSignInGoogle(activity) }, enabled = !isCloudBusy) {
                                    Text("Sign In With Google")
                                }
                            } else {
                                Text(
                                    "Google sign-in is not configured yet.",
                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                                )
                            }
                            Button(onClick = onSignInCloud, enabled = !isCloudBusy) {
                                Text("Use Anonymous Cloud")
                            }
                        } else {
                            Button(onClick = onSyncNow, enabled = !isCloudBusy) {
                                Text("Sync Now")
                            }
                            if (cloudProviderLabel == "Anonymous" && isGoogleSignInConfigured && activity != null) {
                                Button(onClick = { onSignInGoogle(activity) }, enabled = !isCloudBusy) {
                                    Text("Upgrade To Google")
                                }
                            }
                            Button(onClick = onSignOutCloud, enabled = !isCloudBusy) {
                                Text("Sign Out")
                            }
                        }
                    }
                    Text(
                        "This build still uses the Firestore roster API for roster lookup, but now includes Firebase-backed auth and sync foundations."
                    )
                    if (!isGoogleSignInConfigured) {
                        Text(
                            "To enable Google sign-in, add SCADJUTANT_GOOGLE_WEB_CLIENT_ID to android/local.properties and resync.",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun EmptyState(
    modifier: Modifier = Modifier,
    title: String,
    body: String,
) {
    Box(
        modifier = modifier.fillMaxSize().padding(24.dp),
        contentAlignment = Alignment.Center,
    ) {
        Card {
            Column(
                modifier = Modifier.padding(20.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                Text(title, style = MaterialTheme.typography.titleLarge)
                Text(body, style = MaterialTheme.typography.bodyMedium)
            }
        }
    }
}

private fun Context.findActivity(): Activity? = when (this) {
    is Activity -> this
    is ContextWrapper -> baseContext.findActivity()
    else -> null
}
