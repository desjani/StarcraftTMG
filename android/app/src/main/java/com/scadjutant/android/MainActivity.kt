package com.scadjutant.android

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.lifecycle.viewmodel.compose.viewModel
import com.scadjutant.android.ui.ScAdjutantApp
import com.scadjutant.android.ui.theme.ScAdjutantTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            ScAdjutantTheme {
                val mainViewModel: MainViewModel = viewModel(factory = MainViewModel.factory(application))
                ScAdjutantApp(viewModel = mainViewModel)
            }
        }
    }
}
