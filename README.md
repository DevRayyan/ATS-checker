<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="public/brand/ats-checker-logo-light.svg">
    <img src="public/brand/ats-checker-logo.svg" alt="ATS Checker" width="320">
  </picture>
</p>

<p align="center"><strong>See how well your resume matches a job description, which keywords you are missing, and what to fix first.</strong></p>

<p align="center">
  <a href="https://devrayyan.github.io/ATS-checker/"><strong>Live demo</strong></a> ·
  <a href="https://github.com/DevRayyan/ATS-checker/issues">Report an issue</a>
</p>

Most resumes are filtered by software before a person reads them. ATS Checker takes your resume, with or without a job posting, tells you how ready it is, and shows exactly what to change. Add a job description to check against a specific role, or leave it empty for a general ATS check. It runs entirely in the browser: there is no backend and no database.

**Try it:** [devrayyan.github.io/ATS-checker](https://devrayyan.github.io/ATS-checker/). Press **Sample** in both boxes to see a result in a few seconds.

## What you get

| Area | What it does |
|---|---|
| **ATS score** | One 0 to 100 score, split into keyword match and an AI review of fit and clarity |
| **Job description is optional** | Without one, the role is read from your resume and checked against the keywords that role usually needs |
| **Keywords** | The skills and tools the job asks for, marked found or missing, with required ones called out |
| **Section check** | Contact details, summary, experience, education and skills |
| **Fix list** | Four to six concrete edits, most valuable first, each with an example line |
| **Bullet rewrite** | Streams five stronger versions of your weakest bullets. It never invents facts, it leaves `[X%]` placeholders |
| **PDF and Word upload** | Reads a PDF or a `.docx` file in your browser. Your file is never uploaded anywhere |

## How the score works

The AI is asked for the job's keywords and a quality rating. It is **not** trusted to say whether a keyword is in your resume. That check is plain code in [`src/lib/keywords.ts`](src/lib/keywords.ts), so it is repeatable and easy to test.

```
overall = 60% keyword match + 40% AI review
keyword match = found / total, where a required keyword counts double
```

Matching handles whole words only (`Java` does not match `JavaScript`), symbols (`C++`, `C#`, `Node.js`) and `React` against `React.js`.

## Tech stack

- React 18, TypeScript and Vite 5
- Tailwind CSS 3 with Google Sans
- [Groq](https://groq.com) chat completions with `openai/gpt-oss-120b`, JSON mode for the analysis and streaming for the rewrite
- pdf.js for PDFs and mammoth for Word files, each loaded only when you upload that type
- Vitest

## Run it locally

You need Node.js 18 or newer and a Groq API key from [console.groq.com/keys](https://console.groq.com/keys).

```bash
git clone https://github.com/DevRayyan/ATS-checker.git
cd ATS-checker
npm install
cp .env.example .env
```

Put your key in `.env`:

```
VITE_GROQ_API_KEY=gsk_...
VITE_GROQ_MODEL=openai/gpt-oss-120b
```

```bash
npm run dev      # start the app
npm test         # run the tests
npm run build    # type-check and build to dist/
npm run deploy   # build and publish to the gh-pages branch
```

## A note on the API key

This is a static site, so any `VITE_` value is compiled into the JavaScript that visitors download. Anyone can read it. That is fine for a demo, but if you fork this:

- use your **own** key and set a spend limit in the Groq console, and
- for a real product, put the key behind a small server or serverless function instead.

## Project structure

| Path | Contents |
|---|---|
| `src/lib/groq.ts` | Groq client: chat, streaming and error messages |
| `src/lib/analyze.ts` | Prompts and parsing of the model's JSON |
| `src/lib/keywords.ts` | Keyword matching and score maths |
| `src/lib/pdf.ts` | PDF text extraction |
| `src/components/` | Header, input boxes, results and the rewrite panel |
| `scripts/make-logo.mjs` | Builds the logo SVGs, with the wordmark converted to outlines |
| `scripts/deploy.mjs` | Publishes `dist/` to GitHub Pages |

## License

[MIT](LICENSE)
