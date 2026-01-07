const pluginRss = require("@11ty/eleventy-plugin-rss");
const pluginSyntaxHighlight = require("@11ty/eleventy-plugin-syntaxhighlight");
const { EleventyRenderPlugin } = require("@11ty/eleventy");
const { DateTime } = require("luxon");
const pluginNavigation = require("@11ty/eleventy-navigation");
const { eleventyImageTransformPlugin } = require("@11ty/eleventy-img");
const markdownIt = require("markdown-it");
const markdownItAttrs = require("markdown-it-attrs");
const markdownItTocDoneRight = require("markdown-it-toc-done-right");

module.exports = function (eleventyConfig) {
  // --- Markdown Configuration ---
  const mdOptions = {
    html: true,
    linkify: true,
    typographer: true
  };

  const md = markdownIt(mdOptions)
    .use(markdownItAttrs)
    .use(markdownItTocDoneRight, {
      level: [2, 3, 4],
      listType: "ul",
      listClass: "toc-list"
    });

  eleventyConfig.setLibrary("md", md);

  // --- Plugins ---
  eleventyConfig.addPlugin(pluginRss);
  eleventyConfig.addPlugin(pluginSyntaxHighlight, {
    preProcessor: function (content) {
      return content.replace(/^(-{3}[\s\S]+?-{3})/gm, "");
    }
  });
  eleventyConfig.addPlugin(EleventyRenderPlugin);
  eleventyConfig.addPlugin(pluginNavigation);

  // --- Image Plugin ---
  eleventyConfig.addPlugin(eleventyImageTransformPlugin, {
    formats: ["webp", "jpeg"],
    urlPath: "/assets/images/",
    outputDir: "./_site/assets/images/",
  });

  // --- Passthrough Copy ---
  eleventyConfig.addPassthroughCopy("./src/static");
  eleventyConfig.addPassthroughCopy("./src/assets");
  eleventyConfig.addPassthroughCopy("./src/**/*.webp");
  eleventyConfig.addPassthroughCopy("./src/**/*.gif");
  eleventyConfig.addPassthroughCopy("./src/**/*.jpg");
  eleventyConfig.addPassthroughCopy("./src/**/*.png");
  eleventyConfig.addPassthroughCopy("./src/**/*.pdf");

  // --- Watch Targets ---
  eleventyConfig.addWatchTarget("./src/assets/css/");
  eleventyConfig.addWatchTarget("./src/assets/js/");

  // --- Collections ---

  // Writing collection
  eleventyConfig.addCollection("writing", function (collectionApi) {
    return collectionApi.getFilteredByGlob("./src/writing/**/*.md")
      .filter(item => !item.data.draft)
      .sort((a, b) => b.date - a.date);
  });

  // Gallery collection
  eleventyConfig.addCollection("gallery", function (collectionApi) {
    return collectionApi.getFilteredByGlob("./src/gallery/**/*.md")
      .filter(item => !item.data.draft)
      .sort((a, b) => (b.data.shot_date || b.date) - (a.data.shot_date || a.date));
  });

  // Tag collection
  eleventyConfig.addCollection("tagList", function (collectionApi) {
    const tagSet = new Set();
    collectionApi.getAll().forEach(item => {
      (item.data.tags || []).forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  });

  // --- Filters ---

  // Date filter (Indonesian format)
  eleventyConfig.addFilter("displayDate", (dateObj) => {
    return DateTime.fromJSDate(dateObj).toLocaleString(DateTime.DATE_FULL, {
      locale: "id-ID"
    });
  });

  // Word count
  eleventyConfig.addFilter("wordCount", (content) => {
    const text = content.replace(/<[^>]+>/g, "");
    return text.trim().split(/\s+/).length;
  });

  // Reading time (200 words per minute for Indonesian)
  eleventyConfig.addFilter("readingTime", (content) => {
    const words = eleventyConfig.getFilter("wordCount")(content);
    return Math.ceil(words / 200);
  });

  // Slugify filter for tags
  eleventyConfig.addFilter("slugify", (str) => {
    return str.toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/--+/g, "-");
  });

  // Group by year
  eleventyConfig.addFilter("groupByYear", (collection) => {
    const years = {};
    collection.forEach(item => {
      const year = item.date.getFullYear();
      if (!years[year]) years[year] = [];
      years[year].push(item);
    });
    return years;
  });

  // TOC filter (extract TOC from markdown content)
  eleventyConfig.addFilter("toc", (content) => {
    const tocRegex = /<div class="table_of_contents">([\s\S]*?)<\/div>/;
    const match = content.match(tocRegex);
    return match ? match[1] : "";
  });

  // --- Shortcodes (Nunjucks Macros) ---

  // Photo shortcode with EXIF (async)
  eleventyConfig.addNunjucksAsyncShortcode("photo", async function (src, alt = "", caption = "") {
    const exifr = require("exifr");
    const path = require("path");
    const fs = require("fs");

    let exifHtml = "";
    try {
      // Try to find the image relative to the current page
      const pageDir = path.dirname(this.page.inputPath);
      const imagePath = path.join(pageDir, src);

      if (fs.existsSync(imagePath)) {
        const exif = await exifr.parse(imagePath);

        if (exif) {
          const model = exif.Make && exif.Model ? `${exif.Make} ${exif.Model}` : exif.Model;
          const focalLength = exif.FocalLength ? `${exif.FocalLength}mm` : null;
          const aperture = exif.FNumber ? `f/${exif.FNumber}` : null;
          const exposureTime = exif.ExposureTime ? exif.ExposureTime.toString() : null;
          const iso = exif.ISO ? `ISO ${exif.ISO}` : null;

          const parts = [
            model || "",
            focalLength ? `@ ${focalLength}` : "",
            aperture ? `— ${aperture}` : "",
            exposureTime ? `, ${exposureTime}s` : "",
            iso || ""
          ].filter(Boolean).join(" ");

          if (parts) {
            exifHtml = `<span class="image_meta">${parts}</span>`;
          }
        }
      }
    } catch (error) {
      // Silently fail if EXIF extraction fails
    }

    const altText = alt || caption || "";
    const captionHtml = caption ? `<p>${caption}</p>` : "";

    return `
      <figure class="big">
        <img src="${src}" alt="${altText}" loading="lazy" />
        <figcaption>
          ${captionHtml}
          ${exifHtml}
        </figcaption>
      </figure>
    `;
  });

  // Figure shortcode (sync)
  eleventyConfig.addShortcode("figure", function (src, alt = "", width = "", className = "", caption = "") {
    const widthAttr = width ? `width="${width}"` : "";
    const captionHtml = caption ? `<figcaption><p>${caption}</p></figcaption>` : "";

    return `
      <figure class="${className}">
        <img src="${src}" alt="${alt}" ${widthAttr} loading="lazy" />
        ${captionHtml}
      </figure>
    `;
  });

  // --- Return Configuration ---
  return {
    dir: {
      input: "src",
      includes: "_includes",
      data: "_data",
      output: "_site"
    },
    templateFormats: ["md", "njk", "html"],
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    dataTemplateEngine: "njk",
    passthroughFileCopy: true,
  };
};
