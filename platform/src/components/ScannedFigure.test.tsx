// El recorte de la figura original del libro.
//
// Lo que se vigila es una sola cosa, y es la que el tema oscuro pone en
// peligro: que la figura siga sobre BLANCO. La imagen está renderizada sobre
// blanco y sus rellenos son el dato de la pregunta —cuál de las figuras es la
// clara y cuál la oscura—, así que oscurecer el fondo o invertir la imagen
// cambiaría la figura y no el decorado. Es una hoja de papel apoyada en la
// mesa, y el examen real también es sobre papel claro.
import { describe, it, expect, afterEach } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { ScannedFigure } from './ScannedFigure'

afterEach(cleanup)

describe('una figura escaneada', () => {
  it('va sobre papel, no sobre la superficie del tema', () => {
    render(<ScannedFigure questionId="abs-12" kind="prompt" alt="La serie" />)
    const img = screen.getByAltText('La serie')
    expect(img.className).toContain('bg-paper')
    // Y no sobre la tarjeta: en el tema oscuro eso dejaría un recuadro oscuro
    // alrededor de una imagen blanca, o peor, invitaría a invertirla.
    expect(img.className).not.toContain('bg-raised')
  })

  it('no lleva ningún filtro de color', () => {
    // `filter: invert` sobre esto es la solución que parece obvia y es la que
    // rompe la pregunta.
    render(<ScannedFigure questionId="abs-12" kind="prompt" alt="La serie" />)
    const img = screen.getByAltText('La serie')
    expect(img.className).not.toMatch(/invert|sepia|hue-rotate|brightness/)
  })

  it('pide la imagen bajo la ruta base publicada', () => {
    // Si se le cayera la base, en GitHub Pages las 240 figuras darían 404 y la
    // prueba de abstracto se quedaría sin enunciado.
    render(<ScannedFigure questionId="abs-7" kind="options" alt="Las opciones" />)
    const src = screen.getByAltText('Las opciones').getAttribute('src')
    expect(src).toBe(`${import.meta.env.BASE_URL}figures/abstract/abs-7-options.webp`)
  })

  it('el texto alternativo llega tal cual: es la vía de quien no ve la imagen', () => {
    render(<ScannedFigure questionId="abs-1" kind="prompt" alt="Cuatro cuadrados girando" />)
    expect(screen.getByAltText('Cuatro cuadrados girando')).toBeTruthy()
  })
})
