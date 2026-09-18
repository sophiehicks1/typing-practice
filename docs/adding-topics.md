# Adding and editing text topics

Topics are the heart of what makes this typing test interesting, and they are
designed to be the easiest thing to change. This guide is the definitive
walkthrough.

## What a topic is

A **topic** is a themed pool of sentences. When you start a run, the app stitches
a passage together by shuffling and concatenating sentences from the chosen topic
(or from all topics, for the "Random" option) until the passage is long enough.
Because the pool is reshuffled every round, passages effectively never repeat.

Each topic lives in its own JSON file under `src/content/topics/`. There is **no
central registry** -- files are discovered automatically. Adding a topic means
adding one file; removing a topic means deleting one file.

## Add a new topic

1. Create `src/content/topics/<topic-id>.json`. The file name (without `.json`)
   must equal the topic's `id`.

2. Use this shape:

   ```json
   {
     "id": "space-and-stars",
     "name": "Space & stars",
     "description": "A short, friendly summary shown to the user.",
     "sentences": [
       "The first sentence in the pool, written in plain ASCII.",
       "Another complete sentence that stands on its own.",
       "... at least ten sentences total ..."
     ]
   }
   ```

3. Run the tests:

   ```bash
   npm test
   ```

   The content tests validate every topic file and will point at the exact
   problem (and file) if something is wrong.

4. Start the app with `npm run dev` and your topic will appear in the picker,
   sorted alphabetically by `name`.

## Extend an existing topic

Open the topic's JSON file and add more strings to its `sentences` array. Keep
each sentence self-contained (it may appear next to any other sentence), and make
sure it follows the content rules below. Run `npm test` when you are done.

## Content rules (enforced by tests)

These rules live in `src/content/schema.js` and are checked both at app load time
and in CI. A topic is valid only if:

- **`id`** is kebab-case (`lower-case-with-hyphens`) and matches the file name.
- **`id`** and **`name`** are unique across all topics.
- **`name`** and **`description`** are non-empty, printable ASCII.
- **`sentences`** has at least **10** entries (`MIN_SENTENCES`).
- Every sentence is:
  - printable **ASCII only** -- no smart quotes, em dashes, or accents. Use a
    straight apostrophe (`'`) and hyphen (`-`).
  - free of line breaks and tabs (a passage is one continuous line, so the user
    never needs to press Enter).
  - between **20 and 120** characters (`MIN_SENTENCE_LENGTH` /
    `MAX_SENTENCE_LENGTH`).
  - trimmed (no leading or trailing whitespace).
  - unique within the topic (case-insensitive).

If you have a good reason to change a limit (say, allow longer sentences), change
the constant in `src/content/schema.js` -- the tests read the same constants, so
they will stay in sync.

## Writing good practice text

The rules above keep content valid; these tips keep it pleasant to type:

- Write natural, complete sentences with ordinary punctuation.
- Aim for a mix of common and slightly less common words.
- Avoid unusual symbols and numbers-heavy strings unless the topic is about them
  (the finance topic, for example, intentionally includes figures like `2%`).
- Since sentences are shuffled, each one should read fine in any order -- avoid
  "As mentioned above..." style references.
