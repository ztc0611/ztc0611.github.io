#!/usr/bin/env python3
"""
Simple static blog generator for GitHub Pages.
Reads markdown files from blog_posts/ and generates full pages + RSS feed.
"""

import os
import re
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo
from PIL import Image


def parse_metadata(content):
    """Extract metadata from HTML comments at the top of the file."""
    metadata = {}
    comment_match = re.search(r'<!--\s*(.*?)\s*-->', content, re.DOTALL)
    if comment_match:
        for line in comment_match.group(1).strip().split('\n'):
            if ':' in line:
                key, value = line.split(':', 1)
                metadata[key.strip()] = value.strip()
    return metadata


def parse_markdown_to_html(content):
    """Convert custom markdown format to HTML."""
    lines = content.split('\n')
    html_lines = []
    footnote_counter = 1
    footnote_texts = []
    in_list = False
    list_type = None  # 'ul' or 'ol'
    in_code_block = False
    code_block_lines = []

    i = 0
    while i < len(lines):
        line = lines[i]

        # Handle code blocks ```
        if line.strip().startswith('```'):
            if not in_code_block:
                # Start code block
                in_code_block = True
                code_block_lines = []
                i += 1
                continue
            else:
                # End code block
                in_code_block = False
                code_content = '\n'.join(code_block_lines)
                code_content = escape_html(code_content)
                html_lines.append(f'<pre><code>{code_content}</code></pre>')
                i += 1
                continue

        # If in code block, just collect lines
        if in_code_block:
            code_block_lines.append(line)
            i += 1
            continue

        # Handle image comments <!--img ... -->
        if line.strip().startswith('<!--img'):
            # Collect multi-line image comment
            img_comment = line
            while not line.strip().endswith('-->'):
                i += 1
                if i >= len(lines):
                    break
                line = lines[i]
                img_comment += '\n' + line

            # Parse image comment attributes
            src_match = re.search(r'src:\s*(.+?)(?:\n\s*(?:alt:|caption:|source:|class:)|-->)', img_comment, re.DOTALL)
            alt_match = re.search(r'alt:\s*(.+?)(?:\n\s*(?:caption:|source:|class:|src:)|-->)', img_comment, re.DOTALL)
            caption_match = re.search(r'caption:\s*(.+?)(?:\n\s*(?:source:|class:|src:|alt:)|-->)', img_comment, re.DOTALL)
            source_match = re.search(r'source:\s*(.+?)(?:\n\s*(?:class:|src:|alt:|caption:)|-->)', img_comment, re.DOTALL)
            class_match = re.search(r'class:\s*(.+?)(?:\n\s*(?:src:|alt:|caption:|source:)|-->)', img_comment, re.DOTALL)

            if src_match:
                src = src_match.group(1).strip()
                # Replace ~ with /blog_assets/
                if src.startswith('~'):
                    src = '/blog_assets' + src[1:]
                alt = alt_match.group(1).strip() if alt_match else ''
                caption_text = caption_match.group(1).strip() if caption_match else ''
                source_text = source_match.group(1).strip() if source_match else ''
                img_class = class_match.group(1) if class_match else ''

                # Process caption for inline footnotes and markdown links
                if caption_text:
                    caption_text = escape_html(caption_text)
                    caption_text = process_inline_footnotes(caption_text, footnote_counter, footnote_texts)
                    footnote_counter = len(footnote_texts) + 1
                    # Convert \n to <br>
                    caption_text = caption_text.replace('\\n', '<br>')

                # Combine caption and source
                full_caption = caption_text
                if source_text:
                    # Process inline styles and markdown links in source text
                    source_text = escape_html(source_text)
                    source_text = process_inline_styles(source_text)
                    source_text = process_markdown_links(source_text)
                    if full_caption:
                        full_caption += '<br>'
                    full_caption += 'Source: ' + source_text

                # Determine if we need picture element for webp/heic
                ext = src.split('.')[-1].lower()
                if ext in ['webp', 'heic']:
                    jpg_src = re.sub(r'\.(webp|heic)$', '.jpg', src, flags=re.IGNORECASE)
                    mime_type = 'image/heic' if ext == 'heic' else 'image/webp'
                    picture_class = f' class="{img_class}"' if img_class else ''
                    img_html = f'''<picture{picture_class}>
  <source srcset="{src}" type="{mime_type}">
  <img src="{jpg_src}" alt="{alt}">
</picture>'''
                else:
                    class_attr = f' class="{img_class}"' if img_class else ''
                    img_html = f'<img src="{src}" alt="{alt}"{class_attr}>'

                if full_caption:
                    html_lines.append(f'<figure>\n{img_html}\n<figcaption>{full_caption}</figcaption>\n</figure>')
                else:
                    html_lines.append(img_html)

            i += 1
            continue

        # Skip regular HTML comments
        if line.strip().startswith('<!--') and not line.strip().startswith('<!--img'):
            while i < len(lines) and '-->' not in line:
                i += 1
                if i < len(lines):
                    line = lines[i]
            i += 1
            continue

        # Handle headers
        if line.startswith('#'):
            if in_list:
                html_lines.append(f'</{list_type}>')
                in_list = False
                list_type = None

            level = len(line) - len(line.lstrip('#'))
            header_text = line.lstrip('#').strip()
            header_text = escape_html(header_text)
            header_text = process_inline_footnotes(header_text, footnote_counter, footnote_texts)
            footnote_counter = len(footnote_texts) + 1
            html_lines.append(f'<h{level+1}>{header_text}</h{level+1}>')
            i += 1
            continue

        # Handle unordered lists
        if line.strip().startswith('* '):
            if not in_list or list_type != 'ul':
                if in_list:
                    html_lines.append(f'</{list_type}>')
                html_lines.append('<ul>')
                in_list = True
                list_type = 'ul'
            list_text = line.strip()[2:]
            list_text = escape_html(list_text)
            list_text = process_inline_footnotes(list_text, footnote_counter, footnote_texts)
            footnote_counter = len(footnote_texts) + 1
            html_lines.append(f'<li>{list_text}</li>')
            i += 1
            continue

        # Handle ordered lists (1. 2. 3.)
        ordered_match = re.match(r'^(\d+)\.\s+(.+)$', line.strip())
        if ordered_match:
            if not in_list or list_type != 'ol':
                if in_list:
                    html_lines.append(f'</{list_type}>')
                html_lines.append('<ol>')
                in_list = True
                list_type = 'ol'
            list_text = ordered_match.group(2)
            list_text = escape_html(list_text)
            list_text = process_inline_footnotes(list_text, footnote_counter, footnote_texts)
            footnote_counter = len(footnote_texts) + 1
            html_lines.append(f'<li>{list_text}</li>')
            i += 1
            continue

        # End list if we were in one
        if in_list and not line.strip().startswith('* ') and not re.match(r'^\d+\.\s+', line.strip()):
            html_lines.append(f'</{list_type}>')
            in_list = False
            list_type = None

        # Handle empty lines
        if not line.strip():
            html_lines.append('')
            i += 1
            continue

        # Handle raw HTML (like <img>, <article>)
        if line.strip().startswith('<') and not line.strip().startswith('<!--'):
            html_lines.append(line)
            i += 1
            continue

        # Regular paragraph
        para_text = line.strip()
        para_text = escape_html(para_text)
        para_text = process_inline_footnotes(para_text, footnote_counter, footnote_texts)
        footnote_counter = len(footnote_texts) + 1
        html_lines.append(f'<p>{para_text}</p>')

        i += 1

    # Close list if still open
    if in_list:
        html_lines.append(f'</{list_type}>')

    # Add footnotes section if there are any
    if footnote_texts:
        html_lines.append('')
        html_lines.append('<br>')
        html_lines.append('')
        html_lines.append('<h2>Footnotes</h2>')
        html_lines.append('')
        html_lines.append('<ol>')
        for idx, footnote in enumerate(footnote_texts, 1):
            html_lines.append(f'<li id="fn{idx}">{footnote} <a href="#fnref{idx}">↩</a></li>')
        html_lines.append('</ol>')

    return '\n'.join(html_lines)


def process_inline_footnotes(text, start_counter, footnote_texts):
    """Process inline footnotes [^text] and replace with superscript links."""
    counter = start_counter

    def replace_footnote(match):
        nonlocal counter
        footnote_text = match.group(1)
        # Process inline styles and markdown links within footnotes
        footnote_text = process_inline_styles(footnote_text)
        footnote_text = process_markdown_links(footnote_text)
        footnote_texts.append(footnote_text)
        result = f'<sup><a href="#fn{counter}" id="fnref{counter}">{counter}</a></sup>'
        counter += 1
        return result

    # Match [^...] patterns with greedy matching to capture everything until the final ]
    # This regex looks for [^ followed by anything (including nested parens/brackets) until the last ]
    def find_footnotes(text):
        result = []
        i = 0
        while i < len(text):
            if text[i:i+2] == '[^':
                # Find the matching closing bracket
                start = i
                i += 2
                bracket_depth = 0
                paren_depth = 0
                while i < len(text):
                    if text[i] == '\\':
                        # Skip escaped characters
                        i += 2
                        continue
                    elif text[i] == '[':
                        bracket_depth += 1
                    elif text[i] == ']':
                        if bracket_depth == 0 and paren_depth == 0:
                            # This is the closing ] for our footnote
                            break
                        bracket_depth -= 1
                    elif text[i] == '(':
                        paren_depth += 1
                    elif text[i] == ')':
                        paren_depth -= 1
                    i += 1
                end = i + 1  # Include the closing ]
                result.append((start, end, text[start+2:i]))
            else:
                i += 1
        return result

    footnotes = find_footnotes(text)
    # Process from end to start to maintain indices
    for start, end, footnote_content in reversed(footnotes):
        replacement = replace_footnote(type('Match', (), {'group': lambda self, n: footnote_content})())
        text = text[:start] + replacement + text[end:]

    # Process inline styles and markdown links in the remaining text
    result = process_inline_styles(text)
    result = process_markdown_links(result)
    return result


def process_markdown_links(text):
    """Convert markdown links [text](url) to HTML."""
    return re.sub(r'\[([^\]]+)\]\(([^\)]+)\)', r'<a href="\2">\1</a>', text)


def process_inline_styles(text):
    """Convert inline markdown styles (bold, italic, code) to HTML."""
    # Code first (so ** and * inside code blocks are preserved)
    text = re.sub(r'`([^`]+)`', r'<code>\1</code>', text)
    # Bold (** or __)
    text = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', text)
    text = re.sub(r'__(.+?)__', r'<strong>\1</strong>', text)
    # Italic (* or _) - but not part of ** or __
    text = re.sub(r'(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)', r'<em>\1</em>', text)
    text = re.sub(r'(?<!_)_(?!_)(.+?)(?<!_)_(?!_)', r'<em>\1</em>', text)
    return text


def escape_html(text):
    """Escape HTML special characters."""
    text = text.replace('&', '&amp;')
    text = text.replace('<', '&lt;')
    text = text.replace('>', '&gt;')
    return text


def convert_to_jpg(image_path):
    """Convert an image to JPG format if JPG doesn't already exist."""
    jpg_path = re.sub(r'\.(webp|heic)$', '.jpg', str(image_path), flags=re.IGNORECASE)

    # If JPG already exists, skip conversion
    if Path(jpg_path).exists():
        return jpg_path

    try:
        # Open and convert image
        img = Image.open(image_path)

        # Convert RGBA to RGB if necessary (for WebP with transparency)
        if img.mode in ('RGBA', 'LA', 'P'):
            background = Image.new('RGB', img.size, (255, 255, 255))
            if img.mode == 'P':
                img = img.convert('RGBA')
            background.paste(img, mask=img.split()[-1] if img.mode in ('RGBA', 'LA') else None)
            img = background

        # Save as JPG
        img.save(jpg_path, 'JPEG', quality=90)
        print(f"  Converted: {image_path} -> {jpg_path}")
        return jpg_path
    except Exception as e:
        print(f"  Warning: Could not convert {image_path}: {e}")
        return None


def generate_page(content, metadata, slug, date_formatted, updated_formatted=None):
    """Wrap blog post content in site template."""
    title = metadata.get('title', 'Untitled')
    description = metadata.get('description', '')

    # Build date display with optional update line
    date_display = f'<p class="post-date" style="text-align: center;">{date_formatted}</p>'
    if updated_formatted:
        date_display += f'<p class="post-date" style="text-align: center; font-size: 0.9em; margin-top: -15px;">Updated: {updated_formatted}</p>'

    # Build Open Graph image tags if image is specified
    hero_image = metadata.get('image', '')
    og_image_tags = ''
    twitter_image_tags = ''
    if hero_image:
        # Convert relative to absolute URL if needed
        if hero_image.startswith('/'):
            hero_image_url = f"https://ztc0611.github.io{hero_image}"
        else:
            hero_image_url = hero_image

        og_image_tags = f'''
    <meta property="og:image" content="{hero_image_url}">'''
        twitter_image_tags = f'''
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:image" content="{hero_image_url}">'''

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
    <meta name="theme-color" content="#0c116c">
    <title>{title} - Zach Coleman</title>

    <link rel="icon" type="image/png" href="/favicon.ico">
    <link rel="apple-touch-icon" href="/Favicon/favicon.png">

    <meta name="description" content="{description}">
    <link rel="canonical" href="https://ztc0611.github.io/blog/{slug}.html">

    <meta property="og:type" content="article">
    <meta property="og:title" content="{title}">
    <meta property="og:description" content="{description}">
    <meta property="og:url" content="https://ztc0611.github.io/blog/{slug}.html">{og_image_tags}

    <meta name="twitter:title" content="{title}">
    <meta name="twitter:description" content="{description}">{twitter_image_tags}

    <link rel="stylesheet" href="/styles.css">
    <link rel="stylesheet" href="/blog.css">
</head>
<body>
    <main class="content">
        <div style="max-width: 900px; margin: 0 auto;">
            <a href="index.html" class="back-link">← Back to weblog</a>
            <h1 class="post-title">{title}</h1>
            {date_display}
            {content}
            <br>
            <a href="index.html" class="back-link">← Back to weblog</a>
        </div>
    </main>
    <script>
        // Add spatial photo fullscreen support for Vision Pro
        // Supports both img.spatial and picture.spatial > img
        document.addEventListener('DOMContentLoaded', function() {{
            const spatialPhotos = document.querySelectorAll('img.spatial, picture.spatial img');
            spatialPhotos.forEach(function(img) {{
                img.addEventListener('click', async function() {{
                    try {{
                        await img.requestFullscreen();
                    }} catch (error) {{
                        console.log('Fullscreen not supported or denied');
                    }}
                }});
            }});
        }});
    </script>
</body>
</html>"""


def generate_index(posts):
    """Generate blog index page."""
    posts_html = []
    for post in posts:
        posts_html.append(f"""
        <a href="{post['slug']}.html" class="blog-post-preview">
            <div>
                <h3>{post['title']}</h3>
                <p class="post-date">{post['date_formatted']}</p>
                <p>{post['description']}</p>
            </div>
        </a>
        """)

    posts_section = '\n'.join(posts_html)

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
    <meta name="theme-color" content="#0c116c">
    <title>Weblog - Zach Coleman</title>

    <link rel="icon" type="image/png" href="/favicon.ico">
    <link rel="apple-touch-icon" href="/Favicon/favicon.png">

    <link rel="stylesheet" href="/styles.css">
    <link rel="stylesheet" href="/blog.css">
    <link rel="alternate" type="application/rss+xml" title="Zach Coleman's Weblog" href="feed.xml">
</head>
<body>
    <main class="content">
        <div class="blog-container">
            <a href="/" class="back-home">← Back to home</a>
            <a href="feed.xml" class="rss-link">RSS Feed</a>
            <h1 class="blog-title">Weblog</h1>
            {posts_section}
        </div>
    </main>
</body>
</html>"""


def generate_sitemap(posts):
    """Generate XML sitemap for search engines."""
    urls = ['https://ztc0611.github.io/', 'https://ztc0611.github.io/blog/']

    for post in posts:
        # Convert date to W3C format for sitemap
        lastmod = post['date'].strftime('%Y-%m-%d')
        urls.append(f'''  <url>
    <loc>https://ztc0611.github.io/blog/{post['slug']}.html</loc>
    <lastmod>{lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>''')

    urls_xml = '\n'.join(urls[2:])  # Skip the homepage/blog index for separate handling

    return f"""<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://ztc0611.github.io/</loc>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://ztc0611.github.io/blog/</loc>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
{urls_xml}
</urlset>"""


def generate_rss(posts):
    """Generate RSS feed."""
    import html
    items = []
    for post in posts:
        # Convert relative image URLs to absolute URLs for RSS readers
        content_for_rss = post['content']
        # Replace src="/blog_assets/ with full URL
        content_for_rss = content_for_rss.replace('src="/blog_assets/', 'src="https://ztc0611.github.io/blog_assets/')
        # Replace src="../portfolio_assets/ with full URL
        content_for_rss = content_for_rss.replace('src="../portfolio_assets/', 'src="https://ztc0611.github.io/portfolio_assets/')

        # Replace WebP and HEIC extensions with JPG for RSS compatibility
        content_for_rss = re.sub(r'\.webp"', '.jpg"', content_for_rss, flags=re.IGNORECASE)
        content_for_rss = re.sub(r'\.heic"', '.jpg"', content_for_rss, flags=re.IGNORECASE)

        # Add hero image if specified
        hero_image = post.get('image', '')
        enclosure_tag = ''
        if hero_image:
            # Convert relative to absolute URL if needed
            if hero_image.startswith('/'):
                hero_image = f"https://ztc0611.github.io{hero_image}"
            enclosure_tag = f'\n        <enclosure url="{hero_image}" type="image/jpeg" />'

        # Add updated date prefix if present
        content_prefix = ''
        if post.get('updated_formatted'):
            content_prefix = f'<p><em>Updated: {post["updated_formatted"]}</em></p>\n\n'

        items.append(f"""
    <item>
        <title>{post['title']}</title>
        <link>https://ztc0611.github.io/blog/{post['slug']}.html</link>
        <guid>https://ztc0611.github.io/blog/{post['slug']}.html</guid>
        <pubDate>{post['rss_date']}</pubDate>
        <description>{post['description']}</description>{enclosure_tag}
        <content:encoded><![CDATA[{content_prefix}{content_for_rss}]]></content:encoded>
    </item>""")

    items_xml = '\n'.join(items)
    now = datetime.now(ZoneInfo('UTC')).strftime('%a, %d %b %Y %H:%M:%S GMT')

    return f"""<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>Zach Coleman's Weblog</title>
    <link>https://ztc0611.github.io/blog/</link>
    <description>Thoughts on technology, photography, etc.</description>
    <language>en-us</language>
    <lastBuildDate>{now}</lastBuildDate>
    <atom:link href="https://ztc0611.github.io/blog/feed.xml" rel="self" type="application/rss+xml" />
    {items_xml}
  </channel>
</rss>"""


def main():
    blog_dir = Path('blog_posts')
    output_dir = Path('blog')
    output_dir.mkdir(parents=True, exist_ok=True)

    # Convert all WebP and HEIC images to JPG for compatibility
    print("Converting WebP and HEIC images to JPG...")
    asset_path = Path('blog_assets')
    if asset_path.exists():
        for ext in ['webp', 'heic', 'HEIC']:
            for img_file in asset_path.glob(f'*.{ext}'):
                convert_to_jpg(img_file)
    print()

    posts = []

    # Process each markdown file in blog_posts/
    for file_path in sorted(blog_dir.glob('*.md')):
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        metadata = parse_metadata(content)

        # Extract just the content (remove metadata comment)
        content_without_metadata = content
        comment_match = re.search(r'<!--\s*.*?\s*-->', content, re.DOTALL)
        if comment_match:
            content_without_metadata = content[comment_match.end():].strip()

        # Convert markdown to HTML
        html_content = parse_markdown_to_html(content_without_metadata)

        # Wrap in <article> tag
        html_content = f'<article>\n\n{html_content}\n</article>'

        # Extract slug from filename (remove date prefix if present)
        slug = file_path.stem
        if re.match(r'\d{4}-\d{2}-\d{2}-', slug):
            slug = slug[11:]  # Remove YYYY-MM-DD- prefix

        # Parse date and optional time
        date_str = metadata.get('date', '')
        time_str = metadata.get('time', '00:00')  # Default to midnight if not specified

        pacific = ZoneInfo('America/Los_Angeles')  # Handles PST/PDT automatically

        try:
            # Try to parse date with optional time
            datetime_str = f"{date_str} {time_str}"
            date = datetime.strptime(datetime_str, '%Y-%m-%d %H:%M')
            # Make it timezone-aware (Pacific time)
            date = date.replace(tzinfo=pacific)

            # Format for display (shows Pacific time with correct PST/PDT)
            # Remove leading zero from hour and handle the ordinal suffix for day
            day = date.day
            if 10 <= day % 100 <= 20:
                suffix = 'th'
            else:
                suffix = {1: 'st', 2: 'nd', 3: 'rd'}.get(day % 10, 'th')

            hour = date.strftime('%I').lstrip('0')  # Remove leading zero
            date_formatted = f"{date.strftime('%B')} {day}{suffix}, {date.year} at {hour}:{date.strftime('%M %p %Z')}"

            # Convert to UTC for RSS feed
            date_utc = date.astimezone(ZoneInfo('UTC'))
            rss_date = date_utc.strftime('%a, %d %b %Y %H:%M:%S GMT')
        except ValueError:
            # Fallback if parsing fails
            date_formatted = date_str
            date = datetime.now(pacific)
            rss_date = date.astimezone(ZoneInfo('UTC')).strftime('%a, %d %b %Y %H:%M:%S GMT')

        # Parse updated date and optional time
        updated_str = metadata.get('updated', '')
        updated_time_str = metadata.get('updated_time', '00:00')
        updated_formatted = None

        if updated_str:
            try:
                updated_datetime_str = f"{updated_str} {updated_time_str}"
                updated_date = datetime.strptime(updated_datetime_str, '%Y-%m-%d %H:%M')
                updated_date = updated_date.replace(tzinfo=pacific)

                day = updated_date.day
                if 10 <= day % 100 <= 20:
                    suffix = 'th'
                else:
                    suffix = {1: 'st', 2: 'nd', 3: 'rd'}.get(day % 10, 'th')

                hour = updated_date.strftime('%I').lstrip('0')
                updated_formatted = f"{updated_date.strftime('%B')} {day}{suffix}, {updated_date.year} at {hour}:{updated_date.strftime('%M %p %Z')}"
            except ValueError:
                updated_formatted = updated_str

        # Generate full page
        full_page = generate_page(html_content, metadata, slug, date_formatted, updated_formatted)
        output_path = output_dir / f'{slug}.html'
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(full_page)

        posts.append({
            'slug': slug,
            'title': metadata.get('title', 'Untitled'),
            'description': metadata.get('description', ''),
            'image': metadata.get('image', ''),
            'content': html_content,
            'date': date,
            'date_formatted': date_formatted,
            'rss_date': rss_date,
            'updated_formatted': updated_formatted
        })

        print(f"Generated: {output_path}")

    # Sort posts by date (newest first)
    posts.sort(key=lambda x: x['date'], reverse=True)

    # Generate index page
    index_html = generate_index(posts)
    index_path = output_dir / 'index.html'
    with open(index_path, 'w', encoding='utf-8') as f:
        f.write(index_html)
    print(f"Generated: {index_path}")

    # Generate RSS feed
    rss_xml = generate_rss(posts)
    rss_path = output_dir / 'feed.xml'
    with open(rss_path, 'w', encoding='utf-8') as f:
        f.write(rss_xml)
    print(f"Generated: {rss_path}")

    # Generate sitemap
    sitemap_xml = generate_sitemap(posts)
    sitemap_path = Path('sitemap.xml')
    with open(sitemap_path, 'w', encoding='utf-8') as f:
        f.write(sitemap_xml)
    print(f"Generated: {sitemap_path}")

    print(f"\nDone! Generated {len(posts)} posts.")


if __name__ == '__main__':
    main()
