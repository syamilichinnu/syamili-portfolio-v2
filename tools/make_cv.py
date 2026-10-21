"""Builds assets/Syamili_K_Resume.pdf (classic one-column format) from the text in odoo/index.html.
Requires: pip3 install reportlab.  Afterwards run: npm run embed-cv   (or just: npm run cv)"""
import os, re
import xml.etree.ElementTree as ET
from xml.sax.saxutils import escape
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Flowable, KeepTogether

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'odoo', 'index.html')
OUT = os.path.join(ROOT, 'assets', 'Syamili_K_Resume.pdf')

# ---------------------------------------------------------------- read the HTML
raw = open(SRC, encoding='utf8').read()
raw = re.sub(r'data-cv="[^"]*"', 'data-cv=""', raw)          # drop the embedded pdf
raw = raw.replace('&#183;', '·')
root = ET.fromstring(raw)

def cls(el):
    return (el.get('class') or '').split()
def find_all(el, c, tag=None):
    return [e for e in el.iter() if c in cls(e) and (tag is None or e.tag == tag)]
def first(el, c, tag=None):
    r = find_all(el, c, tag)
    return r[0] if r else None
def txt(el):
    return re.sub(r'\s+', ' ', ''.join(el.itertext())).strip()
def li_markup(li):
    out = escape(li.text or '')
    for c in li:
        out += ('<b>%s</b>' % escape(txt(c))) if c.tag == 'strong' else escape(txt(c))
        out += escape(c.tail or '')
    return re.sub(r'\s+', ' ', out).strip()

def child(el, tag):
    return [c for c in el if c.tag == tag]

# sections by id
sections = {e.get('id'): e for e in root.iter('section') if e.get('id')}

about_ps = [txt(p) for p in find_all(first(sections['about'], 'sk-about-text'), 'sk-about-text') for p in child(p, 'p')] \
    if False else [txt(p) for p in first(sections['about'], 'sk-about-text').iter('p')]

highlights = []
for tile in find_all(sections['highlights'], 'sk-hl'):
    highlights.append((txt(next(tile.iter('h3'))), txt(next(tile.iter('p')))))

skills = []
for tile in find_all(sections['skills'], 'sk-tile'):
    title = txt(next(tile.iter('h3')))
    tags = [txt(s) for s in first(tile, 'sk-tags').iter('span')]
    skills.append((title, tags))

exp_lede = txt(first(sections['experience'], 'sk-lede'))
jobs = []
for art in find_all(sections['experience'], 'sk-exp', 'article'):
    jobs.append(dict(
        name=txt(next(art.iter('h3'))),
        sub=txt(next(art.iter('h4'))),
        date=txt(first(art, 'sk-date')),
        tags=[txt(s) for s in first(art, 'sk-tags').iter('span')],
        items=[li_markup(li) for li in art.iter('li')]))

edus = []
for tile in find_all(sections['education'], 'sk-edu'):
    edus.append(dict(date=txt(first(tile, 'sk-date')), degree=txt(next(tile.iter('h3'))),
                     uni=txt(next(tile.iter('h4'))), college=txt(next(tile.iter('p')))))

location = [txt(e) for e in root.iter('span') if 'India' in txt(e) and 's' in cls(e)][0].strip("'")
email_link = [a.get('href') for a in root.iter('a') if (a.get('href') or '').startswith('mailto:')][0]
links = {a.get('href') for a in root.iter('a')}
linkedin = [l for l in links if l and 'linkedin.com' in l][0]
github = [l for l in links if l and 'github.com' in l][0]
role = txt(first(root, 'sk-id-role')) if first(root, 'sk-id-role') is not None else 'Odoo / Python Developer'
role = re.sub(r'\s*/\s*', '/', role)
print('about', len(about_ps), 'highlights', len(highlights), 'skills', len(skills), 'jobs', len(jobs), 'edus', len(edus))

# ---------------------------------------------------------------- PDF layout
W, H = A4
LM = RM = 46
SERIF, SERIF_B, SERIF_I = 'Times-Roman', 'Times-Bold', 'Times-Italic'
BLACK = colors.black

def S(name, **kw):
    d = dict(fontName=SERIF, fontSize=10.3, leading=12.4, textColor=BLACK, alignment=TA_LEFT)
    d.update(kw)
    return ParagraphStyle(name, **d)

st = {
    'name': S('name', fontName=SERIF_B, fontSize=26, leading=29, alignment=TA_CENTER),
    'role': S('role', fontName=SERIF_I, fontSize=11, leading=13, alignment=TA_CENTER),
    'contact': S('contact', fontSize=9.6, leading=12.5, alignment=TA_CENTER),
    'p': S('p', alignment=TA_JUSTIFY, spaceAfter=3),
    'skill': S('skill', leftIndent=10, leading=12.4),
    'tech': S('tech', fontName=SERIF_I, fontSize=9.6, leading=11.6, leftIndent=12, spaceAfter=1.5),
    'b': S('b', leftIndent=24, bulletIndent=12, leading=12.2, spaceAfter=1.2, alignment=TA_JUSTIFY),
}

class Section(Flowable):
    def __init__(self, title):
        Flowable.__init__(self); self.title = title; self.keepWithNext = True
    def wrap(self, aw, ah):
        self.aw = aw; return aw, 21
    def draw(self):
        c = self.canv; x = 0
        for word in self.title.split(' '):
            first_, rest = word[0].upper(), word[1:].upper()
            c.setFont(SERIF, 13.2); c.drawString(x, 8, first_)
            x += c.stringWidth(first_, SERIF, 13.2)
            c.setFont(SERIF, 10.6); c.drawString(x, 8, rest)
            x += c.stringWidth(rest, SERIF, 10.6) + c.stringWidth(' ', SERIF, 13)
        c.setLineWidth(0.6); c.line(0, 3, self.aw, 3)

class Entry(Flowable):
    """Bold title + right text; optional italic second line + right italic text."""
    def __init__(self, left, right, sub='', subright=''):
        Flowable.__init__(self)
        self.left, self.right, self.sub, self.subright = left, right, sub, subright
        self.keepWithNext = True
    def wrap(self, aw, ah):
        self.aw = aw
        self.h = 15 + (14 if (self.sub or self.subright) else 0)
        return aw, self.h
    def draw(self):
        c = self.canv; y = self.h - 11
        c.setFont(SERIF_B, 10.8); c.drawString(12, y, self.left)
        c.setFont(SERIF, 10.4); c.drawRightString(self.aw - 4, y, self.right)
        if self.sub or self.subright:
            y2 = y - 14
            c.setFont(SERIF_I, 10.2); c.drawString(12, y2, self.sub)
            c.drawRightString(self.aw - 4, y2, self.subright)

def bl(items):
    return [Paragraph(t, st['b'], bulletText='•') for t in items]
def link(url, text):
    return '<u><a href="%s" color="black">%s</a></u>' % (escape(url), escape(text))

story = [Paragraph('SYAMILI K', st['name']), Paragraph(escape(role) + ' &nbsp;|&nbsp; ' + escape(location), st['role']),
         Paragraph(' | '.join([link(email_link, 'Email'), link(linkedin, 'LinkedIn'), link(github, 'GitHub')]), st['contact']),
         Spacer(1, 6)]

story += [Section('Summary')] + [Paragraph(escape(t), st['p']) for t in about_ps] + [Spacer(1, 4)]

story += [Section('Key Highlights')]
for t, d in highlights:
    story.append(Paragraph('<b>%s:</b> %s' % (escape(t), escape(d)), st['b'], bulletText='•'))
story.append(Spacer(1, 5))

story += [Section('Technical Skills')]
for t, tags in skills:
    story.append(Paragraph('<b>%s:</b> %s' % (escape(t), escape(', '.join(tags))), st['skill']))
story.append(Spacer(1, 5))

story += [Section('Experience'), Paragraph('<i>%s</i>' % escape(exp_lede), S('lede', leftIndent=12, spaceAfter=3))]
for j in jobs:
    story.append(KeepTogether([Entry(j['name'], j['date'], j['sub']),
                               Paragraph(escape(', '.join(j['tags'])), st['tech'])] + bl(j['items']) + [Spacer(1, 4)]))

story += [Section('Education')]
for e in edus:
    story += [Entry(e['uni'], e['college'], e['degree'], e['date']), Spacer(1, 5)]

def footer(c, doc):
    c.saveState(); c.setFont(SERIF_I, 8.5)
    c.drawCentredString(W / 2, 20, 'Syamili K  |  Page %d' % doc.page); c.restoreState()

doc = SimpleDocTemplate(OUT, pagesize=A4, leftMargin=LM, rightMargin=RM, topMargin=40, bottomMargin=38,
                        title='Syamili K - Resume', author='Syamili K', subject='Odoo/Python Developer')
doc.build(story, onFirstPage=footer, onLaterPages=footer)
print('built', OUT)
