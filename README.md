# Discourse Thread Scraper for Obsidian

A command-line tool that scrapes Discourse forum threads and converts them into clean, well-structured Markdown files. Designed specifically for [Obsidian](https://obsidian.md/) with advanced content processing, smart image handling, and clean external link extraction.

## Features

### Core Functionality
- **Obsidian-Ready**: Generates `.md` files with YAML frontmatter for seamless vault integration
- **Threaded Conversations**: Reconstructs reply hierarchies as nested blockquotes with proper attribution
- **Complete Thread Capture**: Fetches all posts including paginated content automatically
- **Tag Preservation**: Automatically extracts and includes forum tags in frontmatter

### Advanced Content Processing
- **Smart Image Handling**:
  - Filters out avatars and UI elements automatically
  - Applies Obsidian sizing (`![|320]`) for content images
  - Groups consecutive images into gallery layouts
  - Preserves emojis with original sizing
- **External Link Extraction**: Clean links from JSON data instead of messy HTML embeds
- **Onebox Cleanup**: Removes cluttered preview embeds, keeps clean reference links
- **HTML Sanitization**: Secure processing with DOMPurify before conversion

## Requirements

- [Node.js](https://nodejs.org/) (v22.0 or newer)

## Installation

1.  Clone or download this repository.
2.  Install dependencies using npm:
    ```bash
    npm install
    ```

## Usage

### Command Syntax

```bash
discourse-scraper --url <thread_url> [options]
```

To use this command, you first need to make it available on your system. The recommended method is to link it globally using `npm`.

#### Global Installation

1.  First, build the project's TypeScript source code into JavaScript:
    ```bash
    npm run build
    ```

2.  Next, link the package to make the `discourse-scraper` command available system-wide:
    ```bash
    npm link
    ```

After these steps, you can run the command from any terminal.

#### Running with `npx`

Once the package is published to the npm registry, you can also run it directly using `npx`, which executes the command without requiring a manual installation:
```bash
npx @mpelka/discourse-scraper --url <thread_url> [options]
```

### Arguments

- `--url`, `-u`: **(Required)** The full URL to any post within the Discourse thread
- `--target-dir`, `-t`: (Optional) Output directory for the markdown file (default: `./archive`)
- `--help`: Show help information

### Examples

**Basic usage:**
```bash
discourse-scraper --url "https://forum.example.com/t/topic-name/12345/67"
```

**Custom output directory:**
```bash
discourse-scraper --url "https://forum.example.com/t/topic-name/12345" --target-dir ./my-archives
```

## Output Format

The script generates a single `.md` file in the target directory, named using the topic's ID and slug (e.g., `12345-topic-name.md`).

### File Structure

```markdown
---
title: "Topic Title"
source: "https://forum.example.com/t/topic-name/12345/67"
author:
  - "[[original_poster]]"
published: 2023-10-26
created: 2025-07-07
description: "First 150 characters of the original post..."
tags:
  - "forum-tag"
  - "discourse-clipping"
---

Original post content with smart image handling:

![|320](https://example.com/content-image.jpg)

**External Links:**
- [Example Site](https://example.com)
- [Another Reference](https://reference.com)

---

## Comments

> **user_one** • [Post #2](https://forum.example.com/t/12345/2) • 2023-10-26
>
> This is a reply to the original post.
>
> **External Links:**
> - [Helpful Resource](https://resource.com)
>
> > **user_two** • [Post #3](https://forum.example.com/t/12345/3) • 2023-10-26
> >
> > This is a nested reply showing the conversation hierarchy.
```

### Key Features in Output

- **YAML Frontmatter**: Complete metadata for Obsidian integration
- **Author Backlinking**: `[[username]]` format for Obsidian user pages
- **Smart Images**: Properly sized for Obsidian with avatar/emoji filtering
- **External Links**: Clean extraction from JSON data, not messy HTML
- **Threaded Structure**: Nested blockquotes preserve conversation flow
- **Direct Links**: Each post links back to the original forum thread

## Development Commands

```bash
# Install dependencies
npm install

# Build the project (compile TypeScript to JavaScript)
npm run build

# Run linter (with auto-fix)
npm run lint

# Run code formatter
npm run format

# Run TypeScript type checking
npm run typecheck
```

## Dependencies

The project uses these key dependencies:
- **ky**: HTTP client with retry logic and timeout handling
- **turndown**: HTML to Markdown conversion with custom rules
- **isomorphic-dompurify**: HTML sanitization for security
- **ora**: Terminal progress indicators and spinners
- **yargs**: Command-line argument parsing with help text

## License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.