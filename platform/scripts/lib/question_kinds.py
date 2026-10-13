# -*- coding: utf-8 -*-
"""Clasifica cada pregunta por el tipo de ejercicio que es.

Sirve para que la plataforma pueda ofrecer una pestaña por tipo: saber que 23
preguntas del banco numérico son reglas de tres no vale de nada si no se pueden
practicar esas 23 seguidas.

**La taxonomía no se inventa aquí.** Sale del vocabulario con el que la propia
fuente describe su método: el libro de ORSEU escribe «Planteamiento y método:
... un problema de proporcionalidad directa» en cada respuesta resuelta, y el
banco de abstracto describe panel a panel qué atributo avanza. Lo que hace este
módulo es reconocer ese vocabulario y contar.

Una pregunta puede tener varios tipos, y la mayoría los tiene: 64 de las 120
numéricas caen en más de una familia y la serie abstracta media lleva 2,4
atributos. Eso no es un defecto de la clasificación, es cómo son los
ejercicios, y la interfaz lo refleja enseñando la misma pregunta en varias
pestañas.

Las cifras que de aquí salen están ancladas en Docs/9 y comprobadas por
scripts/strategyFigures.test.mjs; este módulo tiene además su propio test.
"""
import re

# ---------------------------------------------------------------- numérico
# (id, etiqueta es, etiqueta en, patrones)
# El orden es el de la guía: de la familia más frecuente a la menos.
NUMERICAL_KINDS = [
    (
        'percentage-of-total',
        'Porcentaje de un total',
        'Percentage of a total',
        [r'\d+\s*%\s*(?:de|of|×|x)', r'representa(?:ba|n)?\s+el', r'proporci[oó]n',
         r'cuota', r'qu[eé] porcentaje', r'what percentage', r'share of'],
    ),
    (
        'rule-of-three',
        'Regla de tres',
        'Rule of three',
        [r'proporcionalidad', r'proportionality', r'regla de tres', r'rule of three',
         r'por 10\.000', r'per 10,000', r'por 1\.000', r'per 1,000', r'por cada',
         r'por habitante', r'per capita', r'per inhabitant', r'densidad', r'density'],
    ),
    (
        'stated-difference',
        'Diferencia dada («es decir, N más»)',
        'Stated difference ("that is, N more")',
        [r'es decir,\s*[\d.,]+\s*(?:m[aá]s|menos)', r'that is,?\s*[\d.,]+\s*(?:more|fewer|less)',
         r'en cu[aá]nto supera', r'how many more', r'cu[aá]ntos?\s+\w+\s+m[aá]s'],
    ),
    (
        'absolute-difference',
        'Diferencia entre dos cifras',
        'Difference between two figures',
        [r'diferencia entre', r'difference between', r'cu[aá]nto m[aá]s',
         r'how much (?:more|larger|greater)', r'restar', r'subtract'],
    ),
    (
        'undo-percentage',
        'Deshacer un porcentaje',
        'Undoing a percentage',
        [r'sin impuestos', r'excluding tax', r'before tax', r'/\s*1[,.]\d',
         r'antes del? (?:aumento|incremento|subida)', r'before the (?:increase|rise)'],
    ),
    (
        'averages',
        'Medias',
        'Averages',
        [r'\bmedia\b', r'promedio', r'por t[eé]rmino medio', r'\baverage\b', r'\bmean\b'],
    ),
    (
        'relative-change',
        'Variación relativa',
        'Relative change',
        [r'variaci[oó]n relativa', r'variaci[oó]n porcentual', r'relative (?:change|variation)',
         r'percentage change'],
    ),
    (
        'time-and-clocks',
        'Horas y tiempo transcurrido',
        'Hours and elapsed time',
        [r'hora local', r'local time', r'\d{1,2}:\d{2}', r'\bhuso\b', r'\bGMT\b'],
    ),
    (
        'unit-conversion',
        'Conversión de unidades',
        'Unit conversion',
        [r'km/h', r'\bnudos\b', r'\bknots\b', r'\bm/s\b', r'mismas unidades',
         r'same units?', r'expresar todo en', r'express everything in'],
    ),
    (
        'rate-and-work',
        'Ritmo y trabajo',
        'Rate and work',
        [r'tarda\s+\d', r'takes\s+\d+\s*(?:minutes|hours)', r'mano de obra',
         r'labour', r'\bvelocidad\b', r'\bspeed\b'],
    ),
    (
        'compound-growth',
        'Interés compuesto',
        'Compound growth',
        [r'\(1[,.]\d+\)[⁰¹²³⁴⁵⁶⁷⁸⁹]', r'tasa de crecimiento', r'growth rate',
         r'cada (?:a[nñ]o|d[ií]a|mes)[^.]{0,40}%', r'each (?:year|day|month)[^.]{0,40}%'],
    ),
    (
        'fractions',
        'Fracciones',
        'Fractions',
        [r'\b\d\s*/\s*\d\s+(?:de|of)\b', r'dos tercios', r'two thirds',
         r'un tercio', r'a third of'],
    ),
    (
        'missing-figure',
        'Dato que falta y hay que deducir',
        'Figure you have to derive',
        [r'oscurecid', r'obscured', r'no puede calcularse directamente',
         r'cannot be calculated directly', r'no suman el 100', r'do not (?:add|total) 100',
         r'no constituyen el 100'],
    ),
    (
        'compare-and-order',
        'Comparar y ordenar',
        'Compare and order',
        [r'm[aá]s (?:alto|alta|bajo|baja|elevado)', r'\bhighest\b', r'\blowest\b',
         r'cu[aá]l de', r'in which (?:country|year)', r'en qu[eé] (?:pa[ií]s|a[nñ]o)'],
    ),
]

# ---------------------------------------------------------------- abstracto
# Los atributos que avanzan en una serie. El banco los describe en su respuesta.
ABSTRACT_KINDS = [
    ('fill', 'Relleno y sombreado', 'Fill and shading',
     [r'relleno', r'sombreado', r'rayad', r'\bnegro\b', r'\bgris\b', r'en blanco',
      r'\bvac[ií]o\b', r'\bfill\b', r'shading', r'hatched', r'\bblack\b', r'\bgrey\b']),
    ('position', 'Posición en el marco', 'Position in the frame',
     [r'posici[oó]n', r'se desliza', r'\branura\b', r'esquina', r'borde del marco',
      r'position', r'\bslot\b', r'\bcorner\b', r'frame edge']),
    ('rotation', 'Rotación', 'Rotation',
     [r'\brota\b', r'\bgira\b', r'sentido (?:horario|antihorario)', r'\d+\s*°',
      r'rotat', r'clockwise', r'anticlockwise', r'counter-?clockwise']),
    ('alternation', 'Alternancia', 'Alternation',
     [r'alterna', r'alternancia', r'alternat']),
    ('size-nesting', 'Tamaño y anidamiento', 'Size and nesting',
     [r'anidad', r'exterior', r'interior', r'\bgrande\b', r'\bpeque[nñ]a\b',
      r'nested', r'\bouter\b', r'\binner\b']),
    ('count', 'Cuántas figuras hay', 'How many figures',
     [r'n[uú]mero de figuras', r'\brecuento\b', r'una m[aá]s', r'se a[nñ]ade',
      r'\bcount\b', r'one more']),
    ('sliding-window', 'Ventana que se desplaza', 'Sliding window',
     [r'\bventana\b', r'se desplaza', r'desplazamiento', r'\bwindow\b', r'\bshift']),
    ('shape-cycle', 'Ciclo de formas', 'Shape cycle',
     [r'ciclo de forma', r'shape cycle', r'tri[aá]ngulo\s*(?:→|->)',
      r'cuadrado\s*(?:→|->)', r'c[ií]rculo\s*(?:→|->)']),
    ('occlusion', 'Una figura tapa a otra', 'One figure hides another',
     [r'oculta', r'ocultando', r'\btapa\b', r'se solap', r'hidden by', r'overlap']),
    ('symmetry', 'Simetría y reflejo', 'Symmetry and reflection',
     [r'simetr', r'refleja', r'\bespejo\b', r'symmetr', r'\bmirror\b', r'reflect']),
]

# Las familias que el motor de figuras ya etiqueta por su cuenta. Se traducen
# aquí para que la pestaña no salga en inglés técnico dentro de la interfaz
# española. Las claves son los tags que escribe el motor.
ENGINE_KINDS = {
    'series': ('Serie', 'Series'),
    'missing_middle': ('Hueco en medio', 'Missing middle'),
    'grid2x2': ('Rejilla 2×2', '2×2 grid'),
    'grid3x3': ('Rejilla 3×3', '3×3 grid'),
    'analogy': ('Analogía', 'Analogy'),
    'odd_one_out': ('La que sobra', 'Odd one out'),
    'setgrid': ('Rejilla de conjuntos', 'Set grid'),
    'countgrid': ('Rejilla de recuento', 'Count grid'),
}

KIND_PREFIX = 'kind:'

# Los rótulos de los temas de campo no son una tabla fija: salen del propio
# banco, uno por ámbito y en los dos idiomas, y el generador los va dejando
# aquí al parsear. Por eso `labels_for` los consulta además de las tablas.
TOPIC_LABELS = {}


def slug(texto):
    """Un identificador estable a partir del título de un tema.

    Estable es lo importante: es lo que va en el tag de cada pregunta, así que
    si cambia, el progreso guardado deja de reconocer su pestaña."""
    limpio = re.sub(r'[^a-z0-9]+', '-', texto.lower()).strip('-')
    return limpio[:60]


def _matches(patterns, haystack):
    return any(re.search(p, haystack, re.I) for p in patterns)


def _classify(table, *texts):
    haystack = ' '.join(t for t in texts if t)
    return [kid for kid, _es, _en, pats in table if _matches(pats, haystack)]


def numerical_kinds(prompt, explanation):
    """Las familias de una pregunta numérica, por su enunciado y su solución."""
    return _classify(NUMERICAL_KINDS, prompt, explanation)


def abstract_kinds(prompt, explanation):
    """Los atributos que avanzan en una serie abstracta."""
    return _classify(ABSTRACT_KINDS, prompt, explanation)


def labels_for(ids):
    """{id: {es, en}} de los tipos usados, para el catálogo del chunk."""
    out = {}
    for table in (NUMERICAL_KINDS, ABSTRACT_KINDS):
        for kid, es, en, _pats in table:
            if kid in ids:
                out[kid] = {'es': es, 'en': en}
    for kid, (es, en) in ENGINE_KINDS.items():
        if kid in ids:
            out[kid] = {'es': es, 'en': en}
    for kid, etiquetas in TOPIC_LABELS.items():
        if kid in ids:
            out[kid] = etiquetas
    return out
