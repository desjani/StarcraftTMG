package com.scadjutant.android.data

import com.scadjutant.android.domain.RosterParser
import com.scadjutant.android.model.ParsedRoster
import com.scadjutant.android.model.TacticalAbility
import com.scadjutant.android.model.TacticalCardDetail
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonNull
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.booleanOrNull
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.doubleOrNull
import kotlinx.serialization.json.intOrNull
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import java.net.HttpURLConnection
import java.net.URL

class RosterRepository {
    private val json = Json { ignoreUnknownKeys = true }

    suspend fun loadRoster(seed: String): ParsedRoster = withContext(Dispatchers.IO) {
        val normalizedSeed = seed.trim().uppercase()
        val flat = fetchDocument("shared_rosters", normalizedSeed)
        val tacticalIds = flat.mapValue("state").stringList("tacticalCardIds")
        val tacticalCards = fetchTacticalCards(tacticalIds)
        RosterParser.parse(flat, tacticalCards)
    }

    private suspend fun fetchDocument(collection: String, id: String): Map<String, Any?> = withContext(Dispatchers.IO) {
        val url = "${BASE_URL}/$collection/${id.urlEncode()}?key=$FIREBASE_API_KEY"
        val (status, body) = httpGet(url)
        if (status !in 200..299) {
            throw Exception(parseFirestoreError(body) ?: "Firestore request failed ($status)")
        }
        val doc = json.parseToJsonElement(body).jsonObject
        flattenDocument(doc)
    }

    private suspend fun fetchTacticalCards(cardIds: List<String>): List<TacticalCardDetail> = withContext(Dispatchers.IO) {
        cardIds.distinct().mapNotNull { id ->
            try {
                val doc = runCatching { fetchDocument("tactical_cards", id) }
                    .getOrElse {
                        val reversed = reverseId(id) ?: return@mapNotNull null
                        fetchDocument("tactical_cards", reversed)
                    }

                val boosts = doc.listValue("boosts")
                val abilities = boosts.mapNotNull { raw ->
                    val boost = raw.mapValue()
                    val name = boost.stringValue("name")
                    val text = boost.stringValue("description", boost.stringValue("text"))
                    if (name.isBlank() && text.isBlank()) return@mapNotNull null
                    TacticalAbility(name = name, text = text)
                }

                TacticalCardDetail(
                    id = id,
                    name = doc.stringValue("name", id),
                    slots = doc.mapValue("slots").mapValues { (_, value) -> value.asInt() },
                    faction = doc.stringValue("faction"),
                    tags = doc.stringValue("tags"),
                    frontUrl = doc.stringValue("frontUrl"),
                    isUnique = doc.booleanValue("isUnique"),
                    resource = doc.nullableInt("resource"),
                    gasCost = doc.nullableInt("gasCost")
                        ?: doc.nullableInt("gas")
                        ?: doc.nullableInt("costGas")
                        ?: doc.nullableInt("cost"),
                    abilities = abilities,
                )
            } catch (_: Exception) {
                null
            }
        }
    }

    private fun reverseId(id: String): String? {
        val parts = id.split('_').map { it.trim() }.filter { it.isNotBlank() }
        if (parts.size < 2) return null
        val reversed = parts.reversed().joinToString("_")
        return reversed.takeIf { it != id }
    }

    private fun flattenDocument(doc: JsonObject): Map<String, Any?> {
        val fields = doc["fields"]?.jsonObject ?: return emptyMap()
        val flattened = fields.mapValues { (_, value) -> flattenValue(value) }.toMutableMap()
        flattened["id"] = doc["name"]?.jsonPrimitive?.contentOrNull?.substringAfterLast('/')
        return flattened
    }

    private fun flattenValue(value: JsonElement): Any? {
        if (value is JsonNull) return null
        if (value !is JsonObject) return primitiveValue(value)

        return when {
            "stringValue" in value -> value["stringValue"]?.jsonPrimitive?.contentOrNull
            "integerValue" in value -> value["integerValue"]?.jsonPrimitive?.contentOrNull?.toIntOrNull()
            "doubleValue" in value -> value["doubleValue"]?.jsonPrimitive?.doubleOrNull
            "booleanValue" in value -> value["booleanValue"]?.jsonPrimitive?.booleanOrNull
            "timestampValue" in value -> value["timestampValue"]?.jsonPrimitive?.contentOrNull
            "nullValue" in value -> null
            "mapValue" in value -> {
                val fields = value["mapValue"]?.jsonObject?.get("fields")?.jsonObject ?: JsonObject(emptyMap())
                fields.mapValues { (_, child) -> flattenValue(child) }
            }
            "arrayValue" in value -> {
                val values = value["arrayValue"]?.jsonObject?.get("values")?.jsonArray ?: JsonArray(emptyList())
                values.map { child -> flattenValue(child) }
            }
            else -> value.mapValues { (_, child) -> flattenValue(child) }
        }
    }

    private fun primitiveValue(value: JsonElement): Any? {
        val primitive = value as? JsonPrimitive ?: return null
        primitive.contentOrNull?.toIntOrNull()?.let { return it }
        primitive.intOrNull?.let { return it }
        primitive.doubleOrNull?.let { return it }
        primitive.booleanOrNull?.let { return it }
        return primitive.contentOrNull
    }

    private fun parseFirestoreError(body: String): String? = runCatching {
        val jsonObject = json.parseToJsonElement(body).jsonObject
        jsonObject["error"]?.jsonObject?.get("message")?.jsonPrimitive?.contentOrNull
    }.getOrNull()

    private fun httpGet(url: String): Pair<Int, String> {
        val connection = URL(url).openConnection() as HttpURLConnection
        return try {
            connection.requestMethod = "GET"
            connection.connectTimeout = 15000
            connection.readTimeout = 15000

            val status = connection.responseCode
            val stream = if (status in 200..299) connection.inputStream else connection.errorStream
            val body = stream?.bufferedReader()?.use { reader -> reader.readText() }.orEmpty()
            status to body
        } finally {
            connection.disconnect()
        }
    }

    private fun String.urlEncode(): String = java.net.URLEncoder.encode(this, Charsets.UTF_8.name())

    companion object {
        private const val FIREBASE_API_KEY = "AIzaSyDHRhS4FIO_1s_2Tn2C77noJRgbs-y_mks"
        private const val PROJECT = "starcrafttmgbeta"
        private const val DATABASE = "starcrafttmgbeta"
        private const val BASE_URL = "https://firestore.googleapis.com/v1/projects/$PROJECT/databases/$DATABASE/documents"
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

private fun Map<String, Any?>.stringList(key: String): List<String> = listValue(key).mapNotNull { value ->
    when (value) {
        is String -> value
        else -> value?.toString()
    }
}

private fun Map<String, Any?>.booleanValue(key: String, default: Boolean = false): Boolean = when (val value = this[key]) {
    is Boolean -> value
    is String -> value.toBooleanStrictOrNull() ?: default
    else -> default
}

private fun Map<String, Any?>.nullableInt(key: String): Int? = when (val value = this[key]) {
    is Int -> value
    is Long -> value.toInt()
    is Double -> value.toInt()
    is Float -> value.toInt()
    is String -> value.toIntOrNull()
    else -> null
}

private fun Any?.asInt(): Int = when (this) {
    is Int -> this
    is Long -> this.toInt()
    is Double -> this.toInt()
    is Float -> this.toInt()
    is String -> this.toIntOrNull() ?: 0
    else -> 0
}
