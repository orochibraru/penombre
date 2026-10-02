package dev.penombre.app

import org.w3c.dom.Element
import java.io.File
import javax.xml.parsers.DocumentBuilderFactory
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertNotNull
import kotlin.test.assertTrue

/**
 * Every language has exactly the English strings, with the same arguments. A
 * key missing from one falls back to English without a word, and an argument
 * lost in translation is a sentence with a hole in it.
 */
class StringsTest {
    private val root = File("src/commonMain/composeResources")

    private class Strings(val strings: Map<String, String>, val plurals: Map<String, Map<String, String>>)

    private fun Element.children(tag: String) = getElementsByTagName(tag).let { list -> (0 until list.length).map { list.item(it) as Element } }

    private fun read(folder: String): Strings {
        val xml = DocumentBuilderFactory.newInstance().newDocumentBuilder().parse(File(root, "$folder/strings.xml")).documentElement
        return Strings(
            xml.children("string").associate { it.getAttribute("name") to it.textContent },
            xml.children("plurals").associate { plural ->
                plural.getAttribute("name") to plural.children("item").associate { it.getAttribute("quantity") to it.textContent }
            },
        )
    }

    private fun arguments(text: String) = Regex("""%(\d+)\$[ds]""").findAll(text).map { it.value }.sorted().toList()

    @Test
    fun everyLanguageHasTheEnglishStringsAndTheirArguments() {
        val english = read("values")
        val folders = root.listFiles { file -> file.name.startsWith("values-") }.orEmpty().map { it.name.removePrefix("values-") }
        assertEquals(LANGUAGES.keys - "en", folders.toSet())
        for (language in folders) {
            val translated = read("values-$language")
            assertEquals(english.strings.keys, translated.strings.keys, language)
            assertEquals(english.plurals.keys, translated.plurals.keys, language)
            english.strings.forEach { (key, text) ->
                val said = translated.strings.getValue(key)
                assertEquals(arguments(text), arguments(said), "$language: $key")
                // Compose resources show a backslash-escaped quote as it is.
                assertFalse("\\'" in said || "\\\"" in said, "$language: $key")
            }
            english.plurals.forEach { (key, items) ->
                val forms = translated.plurals.getValue(key)
                val other = assertNotNull(forms["other"], "$language: $key has no `other`")
                assertEquals(arguments(items.getValue("other")), arguments(other), "$language: $key")
                // `one` may leave the number out; nothing may bring one in.
                forms.values.forEach { assertTrue(arguments(other).containsAll(arguments(it)), "$language: $key") }
            }
        }
    }
}
