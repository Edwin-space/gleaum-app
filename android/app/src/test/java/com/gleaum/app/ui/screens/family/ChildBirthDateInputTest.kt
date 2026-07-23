package com.gleaum.app.ui.screens.family

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class ChildBirthDateInputTest {
    @Test
    fun formatsDigitsAsIsoDateWhileTyping() {
        assertEquals("", formatBirthDateInput(""))
        assertEquals("2015", formatBirthDateInput("2015"))
        assertEquals("2015-0", formatBirthDateInput("20150"))
        assertEquals("2015-03", formatBirthDateInput("201503"))
        assertEquals("2015-03-18", formatBirthDateInput("20150318"))
    }

    @Test
    fun acceptsPastedSeparatorsAndLimitsToEightDigits() {
        assertEquals("2015-03-18", formatBirthDateInput("2015-03-18"))
        assertEquals("2015-03-18", formatBirthDateInput("2015.03.18 extra 99"))
    }

    @Test
    fun rejectsImpossibleOrOutOfRangeDates() {
        assertTrue(isValidBirthDate("2016-02-29"))
        assertFalse(isValidBirthDate("2015-02-29"))
        assertFalse(isValidBirthDate("1899-12-31"))
        assertFalse(isValidBirthDate("2999-01-01"))
    }
}
