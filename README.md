# Sun Engineering Works — Website Redesign

A premium, modern redesign of the Sun Engineering Works website.
Built with plain **HTML5**, **CSS3**, and **vanilla JavaScript** — no frameworks, no build tools.

---

## Folder Structure

```
project/
├── index.html          ← Home page (Hero, Services, Rolled Threads, Capabilities, CTA)
├── about.html          ← About Us + Gallery preview (link to full gallery)
├── products.html       ← Products (detailed horizontal layout) + Additional Operations
├── forms.html          ← Thread Forms (detailed horizontal layout)
├── gallery.html        ← Full Gallery page
├── contact.html        ← Contact info + form
├── css/
│   ├── style.css       ← Main styles (colors, fonts, layout, components)
│   └── responsive.css  ← Tablet / mobile breakpoints
├── js/
│   └── main.js         ← Navigation, animations, form handling
├── images/             ← Put your images here (placeholders included)
└── README.md           ← This file
```

---

## How to Edit Text and Images (no coding)

The site is built by GitHub Pages using Jekyll. All editable text and images live
in the `_data/` folder, one file per page:

| File | What it controls |
|------|------------------|
| `_data/company.yml` | Phone numbers, emails, WhatsApp, address, map link, business hours (used on every page) |
| `_data/home.yml` | Home page |
| `_data/about.yml` | About page |
| `_data/products.yml` | Products list and additional operations |
| `_data/forms.yml` | Thread forms list and die capabilities |
| `_data/gallery.yml` | Gallery photos and captions |
| `_data/contact.yml` | Contact page text |

**Easiest way:** open [Pages CMS](https://app.pagescms.org), sign in with GitHub and
choose this repository. Every page appears as a form; edit, upload images, and click
**Save**. GitHub Pages publishes the change in a minute or two.

Page layout lives in `_layouts/default.html` (header, navigation) and `_includes/`
(footer, quote banner, shared pieces). Editor settings are in `.pages.yml`.

---

## How to Change Colors

All colors are stored as CSS variables at the top of `css/style.css`:

```css
:root {
  --yellow-1: #FFC400;
  --yellow-2: #FFB300;
  --charcoal: #1E1E1E;
  --text: #222222;
  /* ...etc */
}
```

Change a value here and it updates everywhere on the site.

---

## How to Change Fonts

Fonts are loaded from Google Fonts in the `<head>` of `index.html`.
To switch fonts, replace the `<link>` tag and update the variables in `css/style.css`:

```css
:root {
  --font-head: "Space Grotesk", sans-serif;
  --font-body: "Inter", sans-serif;
}
```

---

## How to Change Spacing

Spacing uses an 8-pixel system defined in `css/style.css`:

```css
--space-1: 8px;
--space-2: 16px;
--space-3: 24px;
/* ...etc */
```

---

## How to Edit Contact Information

Contact details are in the **CONTACT SECTION** of `index.html`.
Look for the `<!-- CONTACT INFO START -->` comment.

Phone, email, address, and business hours are all there.

---

## How to Edit the Contact Form

The form currently shows a success message on submit (demo mode).
To connect it to a real email service, edit the submit handler in `js/main.js`
(Section 6 — Contact Form Submission).

---

## How to Host on GitHub Pages (Free)

1. Create a free account on [github.com](https://github.com).
2. Create a new repository and upload all files from the `project/` folder.
3. Go to **Settings → Pages**.
4. Under **Source**, select the `main` branch and `/ (root)` folder.
5. Click **Save**. Your site will be live at
   `https://your-username.github.io/your-repo-name/` within a minute.

---

## How to Host with a Custom Domain

1. Buy a domain from any registrar (GoDaddy, Namecheap, etc.).
2. If using GitHub Pages:
   - In your repo, go to **Settings → Pages → Custom domain**.
   - Enter your domain (e.g. `www.sunengineeringworks.com`) and click **Save**.
   - At your registrar, add these DNS records:
     - **A records** pointing to:
       `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
     - **CNAME record** `www` → `your-username.github.io`
3. For other hosting (Netlify, Vercel, shared hosting):
   - Upload all files from `project/` to the `public_html` or root folder.
   - Point your domain's DNS to the host as per their instructions.

---

## How to Edit Every Page

The site is split into 5 pages. Each page has the same header and footer.
Open the relevant file in any text editor and look for the comment tags:

| Page      | File             | Main comment tags                          |
|-----------|------------------|---------------------------------------------|
| Home      | `index.html`     | `<!-- HERO SECTION -->`, `<!-- SERVICES -->`, `<!-- ROLLED THREADS -->`, `<!-- CAPABILITIES -->` |
| About     | `about.html`     | `<!-- ABOUT SECTION -->`, `<!-- GALLERY SECTION -->`|
| Products  | `products.html`  | `<!-- PRODUCTS DETAILED LIST -->`, `<!-- ADDITIONAL OPERATIONS -->` |
| Forms     | `forms.html`     | `<!-- THREAD FORMS DETAILED LIST -->`        |
| Gallery   | `gallery.html`   | `<!-- GALLERY SECTION -->`                   |
| Contact   | `contact.html`   | `<!-- CONTACT SECTION -->`                   |

The header and footer are identical on every page — if you change a nav link
or footer text, update it in all 5 HTML files.

---

## Browser Support

Works in all modern browsers (Chrome, Firefox, Safari, Edge).
No external JavaScript libraries required.

---

## Credits

Original content and images: Sun Engineering Works
Redesign: Built with HTML5, CSS3, and vanilla JavaScript.
