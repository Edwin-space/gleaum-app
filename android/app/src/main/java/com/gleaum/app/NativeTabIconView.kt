package com.gleaum.app

import android.content.Context
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.Path
import android.graphics.RectF
import android.view.View

enum class NativeTabIcon { HOME, CALENDAR, SPACE, BUDGET, MENU }

class NativeTabIconView(
    context: Context,
    private val icon: NativeTabIcon,
    private val iconColor: Int,
) : View(context) {
    private val paint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = iconColor
        style = Paint.Style.STROKE
        strokeWidth = 2.2f * resources.displayMetrics.density
        strokeCap = Paint.Cap.ROUND
        strokeJoin = Paint.Join.ROUND
    }

    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)
        val w = width.toFloat()
        val h = height.toFloat()
        val left = w * 0.16f
        val right = w * 0.84f
        val top = h * 0.14f
        val bottom = h * 0.86f
        val midX = w / 2f
        val midY = h / 2f
        when (icon) {
            NativeTabIcon.HOME -> drawHome(canvas, left, right, top, bottom, midX)
            NativeTabIcon.CALENDAR -> drawCalendar(canvas, left, right, top, bottom, w, h)
            NativeTabIcon.SPACE -> drawSpace(canvas, left, right, top, bottom, midX, midY)
            NativeTabIcon.BUDGET -> drawBudget(canvas, left, right, top, bottom)
            NativeTabIcon.MENU -> drawMenu(canvas, w, h)
        }
    }

    private fun drawHome(canvas: Canvas, left: Float, right: Float, top: Float, bottom: Float, midX: Float) {
        val path = Path().apply {
            moveTo(left, bottom * 0.58f)
            lineTo(midX, top)
            lineTo(right, bottom * 0.58f)
            lineTo(right, bottom)
            lineTo(left, bottom)
            close()
        }
        canvas.drawPath(path, paint)
        canvas.drawLine(midX - width * 0.11f, bottom, midX - width * 0.11f, bottom * 0.70f, paint)
        canvas.drawLine(midX + width * 0.11f, bottom, midX + width * 0.11f, bottom * 0.70f, paint)
    }

    private fun drawCalendar(canvas: Canvas, left: Float, right: Float, top: Float, bottom: Float, w: Float, h: Float) {
        val rect = RectF(left, top + h * 0.06f, right, bottom)
        canvas.drawRoundRect(rect, w * 0.08f, w * 0.08f, paint)
        canvas.drawLine(left, top + h * 0.30f, right, top + h * 0.30f, paint)
        canvas.drawLine(left + w * 0.17f, top, left + w * 0.17f, top + h * 0.16f, paint)
        canvas.drawLine(right - w * 0.17f, top, right - w * 0.17f, top + h * 0.16f, paint)
    }

    private fun drawSpace(canvas: Canvas, left: Float, right: Float, top: Float, bottom: Float, midX: Float, midY: Float) {
        canvas.drawCircle(midX - width * 0.13f, top + height * 0.24f, width * 0.15f, paint)
        canvas.drawArc(RectF(left, midY * 1.04f, midX + width * 0.13f, bottom), 202f, 136f, false, paint)
        canvas.drawCircle(midX + width * 0.25f, top + height * 0.32f, width * 0.12f, paint)
        canvas.drawArc(RectF(midX + width * 0.06f, midY * 1.08f, right + width * 0.08f, bottom), 214f, 96f, false, paint)
    }

    private fun drawBudget(canvas: Canvas, left: Float, right: Float, top: Float, bottom: Float) {
        val rect = RectF(left, top + height * 0.12f, right, bottom - height * 0.08f)
        canvas.drawRoundRect(rect, width * 0.08f, width * 0.08f, paint)
        canvas.drawLine(left, top + height * 0.40f, right, top + height * 0.40f, paint)
    }

    private fun drawMenu(canvas: Canvas, w: Float, h: Float) {
        canvas.drawLine(w * 0.18f, h * 0.30f, w * 0.82f, h * 0.30f, paint)
        canvas.drawLine(w * 0.18f, h * 0.50f, w * 0.82f, h * 0.50f, paint)
        canvas.drawLine(w * 0.18f, h * 0.70f, w * 0.82f, h * 0.70f, paint)
    }
}
