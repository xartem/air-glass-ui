import type { HelpArticle, HelpArticleRef, HelpGroup, HelpSearchHit } from '../types'

/*
 * Help fixtures (D:help, C11). Real backend reads modules/{slug}/docs/{locale}/*.md;
 * the mock keeps a few finished articles so the /help screen and the "?" sheet are
 * fully browsable. Content follows C11 §3: human language, no technical terms.
 */

interface MockArticle {
  module: string
  page: string
  section: string
  sectionKey: string
  title: string
  /** Screen key for contextual help (front-matter `screen`, C11 §2). */
  screen?: string
  /** True → ui_locale translation is "missing", source-locale text shown (fallback demo). */
  isFallback?: boolean
  markdown: string
}

const ARTICLES: MockArticle[] = [
  {
    module: 'pages',
    page: 'index',
    section: 'Контент',
    sectionKey: 'content',
    title: 'Обзор: страницы и блоки',
    markdown: `Сайт складывается из страниц, а каждая страница — из блоков: текст, галерея, форма, список записей.

## Что где находится

1. **Контент → Страницы** — все страницы сайта: черновики и опубликованные.
2. Внутри страницы — конструктор: блоки можно добавлять, менять местами и убирать.
3. Общие для всего сайта данные (телефон, адрес, соцсети) живут в разделе **Контакты** — поменяли один раз, обновилось везде.

> **Совет.** Не создавайте страницу «Новости» вручную — записи и ленты ведутся в своих разделах, а на страницу они попадают блоком «Список записей».`,
  },
  {
    module: 'pages',
    page: 'create-page',
    section: 'Контент',
    sectionKey: 'content',
    title: 'Как создать страницу',
    screen: 'pages.list',
    markdown: `Страница — это отдельный адрес на сайте: «О компании», «Контакты», посадочная услуги.

## Шаги

1. Откройте **Контент → Страницы** и нажмите **«Добавить»** в правом верхнем углу.
2. Введите заголовок — адрес страницы подставится сам. При необходимости поправьте его.
3. Добавьте блоки кнопкой **«+ Блок»**: текст, галерея, форма, список записей.
4. Нажмите **«Сохранить»**. Страница появится на сайте после смены статуса на **«Опубликована»**.

> **Почему страницы не видно на сайте?** Проверьте статус — черновики видны только в панели. Опубликованная страница появляется на сайте в течение минуты.`,
  },
  {
    module: 'media',
    page: 'upload',
    section: 'Контент',
    sectionKey: 'content',
    title: 'Как загрузить изображения',
    screen: 'media.library',
    markdown: `Все картинки и файлы сайта хранятся в **Медиатеке** — один раз загрузили, используете где угодно.

## Шаги

1. Откройте **Контент → Медиатека** и перетащите файлы прямо в окно — или нажмите **«Загрузить»**.
2. Заполните **альтернативный текст**: его читают поисковики и экранные дикторы.
3. Вставляйте изображение в страницы и записи через кнопку выбора из медиатеки.

> **Фото слишком большое?** Ничего страшного: система сама подготовит уменьшенные копии для сайта. Оригинал сохранится.`,
  },
  {
    module: 'users',
    page: 'roles',
    section: 'Система',
    sectionKey: 'system',
    title: 'Пользователи и роли',
    screen: 'users.list',
    markdown: `Каждый сотрудник заходит в панель под своим аккаунтом, а роль определяет, что ему доступно.

## Как устроено

1. **Система → Пользователи** — список аккаунтов: кто активен и когда заходил.
2. Роль — это набор галочек-разрешений. Готовые роли: Администратор и Редактор; можно создать свою.
3. Смена роли действует сразу — пользователю не нужно перезаходить.

> **Сотрудник ушёл из компании?** Не удаляйте аккаунт — выключите его. История действий сохранится, а вход будет закрыт.`,
  },
  {
    module: 'estate_sources',
    page: 'connection',
    section: 'Система',
    sectionKey: 'system',
    title: 'Подключение источника объявлений',
    isFallback: true,
    markdown: `Listings can arrive automatically from an external source. Once connected, new properties appear on the site without manual work.

## Steps

1. Open **System → Sources** and press **"Add"**.
2. Paste the access key you received from the provider and press **"Test connection"**.
3. Turn the source on. The first full import may take a few hours — progress is shown per language.

> **Numbers look off?** The photo queue is separate: listings appear first, images follow a bit later. This is normal.`,
  },
  {
    module: 'seo',
    page: 'basics',
    section: 'Продвижение',
    sectionKey: 'promotion',
    title: 'SEO: с чего начать',
    screen: 'seo.settings',
    markdown: `Раздел **Продвижение → SEO** отвечает за то, как сайт выглядит в поиске.

## Три вещи, которые стоит проверить

1. **Заголовок и описание по умолчанию** — их видно в результатах поиска, когда у страницы нет своих.
2. **Картинка для соцсетей** — показывается, когда ссылкой на сайт делятся в мессенджерах.
3. У каждой страницы и записи есть вкладка **SEO** — там можно задать свои заголовок и описание.

> **Не спешите закрывать сайт от поисковиков.** Галочка «не индексировать» нужна только для служебных страниц.`,
  },
]

const GROUP_ORDER: { key: string; label: string }[] = [
  { key: 'content', label: 'Контент' },
  { key: 'promotion', label: 'Продвижение' },
  { key: 'system', label: 'Система' },
]

function ref(a: MockArticle): HelpArticleRef {
  return { module: a.module, page: a.page, title: a.title }
}

export function helpTree(): HelpGroup[] {
  return GROUP_ORDER.map((g) => ({
    key: g.key,
    label: g.label,
    articles: ARTICLES.filter((a) => a.sectionKey === g.key).map(ref),
  })).filter((g) => g.articles.length > 0)
}

export function helpPage(module: string, page: string): HelpArticle | null {
  const idx = ARTICLES.findIndex((a) => a.module === module && a.page === page)
  if (idx === -1) return null
  const a = ARTICLES[idx]
  const siblings = ARTICLES.filter((s) => s.sectionKey === a.sectionKey)
  const sIdx = siblings.indexOf(a)
  return {
    module: a.module,
    page: a.page,
    title: a.title,
    section: a.section,
    is_fallback: a.isFallback ?? false,
    markdown: a.markdown,
    prev: sIdx > 0 ? ref(siblings[sIdx - 1]) : null,
    next: sIdx < siblings.length - 1 ? ref(siblings[sIdx + 1]) : null,
  }
}

export function helpForScreen(screenKey: string): HelpArticle | null {
  const a = ARTICLES.find((x) => x.screen === screenKey)
  return a ? helpPage(a.module, a.page) : null
}

export function helpSearch(q: string): HelpSearchHit[] {
  const needle = q.trim().toLowerCase()
  if (needle.length < 2) return []
  return ARTICLES.filter(
    (a) => a.title.toLowerCase().includes(needle) || a.markdown.toLowerCase().includes(needle),
  ).map((a) => {
    const text = a.markdown.replace(/[#>*`]/g, '')
    const pos = text.toLowerCase().indexOf(needle)
    const start = Math.max(0, pos - 40)
    const raw = pos === -1 ? text.slice(0, 110) : text.slice(start, pos + needle.length + 70)
    return { ...ref(a), section: a.section, snippet: (start > 0 ? '…' : '') + raw.trim() + '…' }
  })
}
