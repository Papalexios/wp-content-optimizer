
import { GoogleGenAI, Type } from "@google/genai";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import React, { useState, useMemo, useEffect, useCallback, useReducer } from 'react';
import ReactDOM from 'react-dom/client';

// Debounce function to limit how often a function gets called
const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            func.apply(this, args);
        }, delay);
    };
};

/**
 * A professional, state-of-the-art concurrent promise queue processor.
 * It executes a series of promise-returning functions in parallel with a concurrency limit,
 * preventing API rate-limiting issues while maximizing throughput.
 * @param items The array of items to process.
 * @param promiseFn The function that takes an item and returns a promise.
 * @param onProgress Optional callback to report progress for each item.
 * @param concurrency The maximum number of promises to run in parallel.
 */
const processConcurrentPromiseQueue = async <T, R>(
    items: T[],
    promiseFn: (item: T) => Promise<R>,
    onProgress: (progress: { item: T; result?: R; error?: Error; index: number; success: boolean }) => void,
    concurrency: number = 3
) => {
    const queue = [...items.map((item, index) => ({ item, index }))];
    const results = new Array(items.length);
    const runningPromises: Promise<void>[] = [];

    const worker = async () => {
        while (queue.length > 0) {
            const task = queue.shift();
            if (!task) continue;
            const { item, index } = task;

            try {
                const result = await promiseFn(item);
                results[index] = { status: 'fulfilled', value: result };
                if (onProgress) onProgress({ item, result, index, success: true });
            } catch (error) {
                const err = error instanceof Error ? error : new Error(String(error));
                results[index] = { status: 'rejected', reason: err };
                if (onProgress) onProgress({ item, error: err, index, success: false });
            }
        }
    };

    for (let i = 0; i < concurrency; i++) {
        runningPromises.push(worker());
    }

    await Promise.all(runningPromises);
    return results;
};


const SITE_PROMOTION_URLS = [
    "https://affiliatemarketingforsuccess.com/blog/", "https://affiliatemarketingforsuccess.com/seo/write-meta-descriptions-that-convert/", "https://affiliatemarketingforsuccess.com/blogging/winning-content-strategy/", "https://affiliatemarketingforsuccess.com/review/copy-ai-review/", "https://affiliatemarketingforsuccess.com/how-to-start/how-to-choose-a-web-host/", "https://affiliatemarketingforsuccess.com/ai/detect-ai-writing/", "https://affiliatemarketingforsuccess.com/affiliate-marketing/warriorplus-affiliate-program-unlock-lucrative-opportunities/", "https://affiliatemarketingforsuccess.com/affiliate-marketing/understanding-what-is-pay-per-call-affiliate-marketing/", "https://affiliatemarketingforsuccess.com/ai/how-chatbot-can-make-you-money/", "https://affiliatemarketingforsuccess.com/info/influencer-marketing-sales/", "https://affiliatemarketingforsuccess.com/ai/the-power-of-large-language-models/", "https://affiliatemarketingforsuccess.com/how-to-start/10-simple-steps-to-build-your-website-a-beginners-guide/", "https://affiliatemarketingforsuccess.com/blogging/sustainable-content/", "https://affiliatemarketingforsuccess.com/affiliate-marketing/best-discounts-on-black-friday/", "https://affiliatemarketingforsuccess.com/seo/website-architecture-that-drives-conversions/", "https://affiliatemarketingforsuccess.com/blogging/how-to-create-evergreen-content/", "https://affiliatemarketingforsuccess.com/email-marketing/email-marketing-benefits/", "https://affiliatemarketingforsuccess.com/blogging/promote-your-blog-to-increase-traffic/", "https://affiliatemarketingforsuccess.com/ai/discover-the-power-of-chatgpt/", "https://affiliatemarketingforsuccess.com/affiliate-marketing/affiliate-marketing-with-personalized-recommendations/", "https://affiliatemarketingforsuccess.com/seo/benefits-of-an-effective-seo-strategy/", "https://affiliatemarketingforsuccess.com/ai/what-is-ai-prompt-engineering/", "https://affiliatemarketingforsuccess.com/affiliate-marketing/successful-in-affiliate-marketing/", "https://affiliatemarketingforsuccess.com/affiliate-marketing/join-the-best-affiliate-networks/", "https://affiliatemarketingforsuccess.com/affiliate-marketing/beginners-guide-to-affiliate-marketing/", "https://affiliatemarketingforsuccess.com/affiliate-marketing/high-ticket-affiliate-marketing/", "https://affiliatemarketingforsuccess.com/affiliate-marketing/enhance-your-affiliate-marketing-content/", "https://affiliatemarketingforsuccess.com/affiliate-marketing/how-to-do-affiliate-marketing-on-shopify/", "https://affiliatemarketingforsuccess.com/affiliate-marketing/discover-why-affiliate-marketing-is-the-best-business-model/", "https://affiliatemarketingforsuccess.com/affiliate-marketing/how-affiliate-marketing-helps-you-to-become-an-influencer/", "https://affiliatemarketingforsuccess.com/affiliate-marketing/how-to-affiliate-marketing-on-blog/", "https://affiliatemarketingforsuccess.com/affiliate-marketing/affiliate-networks/", "https://affiliatemarketingforsuccess.com/affiliate-marketing/how-to-create-a-landing-page-for-affiliate-marketing/", "https://affiliatemarketingforsuccess.com/review/scalenut-review/", "https://affiliatemarketingforsuccess.com/seo/how-to-improve-your-content-marketing-strategy-in-2025/", "https://affiliatemarketingforsuccess.com/ai/startup-success-with-chatgpt/", "https://affiliatemarketingforsuccess.com/blogging/market-your-blog-the-right-way/", "https://affiliatemarketingforsuccess.com/ai/surfer-seo-alternatives/", "https://affiliatemarketingforsuccess.com/ai/avoid-ai-detection/", "https://affiliatemarketingforsuccess.com/seo/optimize-your-off-page-seo-strategy/", "https://affiliatemarketingforsuccess.com/ai/chatgpt-alternative/", "https://affiliatemarketingforsuccess.com/seo/build-an-effective-seo-strategy/", "https://affiliatemarketingforsuccess.com/email-marketing/understanding-email-marketing/", "https://affiliatemarketingforsuccess.com/ai/write-handwritten-assignments/", "https://affiliatemarketingforsuccess.com/ai/prompt-engineering-secrets/", "https://affiliatemarketingforsuccess.com/seo/boost-your-organic-ranking/", "https://affiliatemarketingforsuccess.com/seo/how-to-use-google-my-business-to-improve-your-blogs-local-seo/", "https://affiliatemarketingforsuccess.com/affiliate-marketing/affiliate-marketing-tips-for-beginners/", "https://affiliatemarketingforsuccess.com/ai/chatgpt-occupation-prompts/", "https://affiliatemarketingforsuccess.com/ai/perplexity-copilot/", "https://affiliatemarketingforsuccess.com/ai/agility-writer-vs-autoblogging-ai/", "https://affiliatemarketingforsuccess.com/ai/split-testing-perplexity-pages-affiliate-sales/", "https://affiliatemarketingforsuccess.com/ai/perplexity-ai-affiliate-funnels-automation/", "https://affiliatemarketingforsuccess.com/ai/ai-content-detectors-reliability/", "https://affiliatemarketingforsuccess.com/ai/google-bard-bypass-detection/", "https://affiliatemarketingforsuccess.com/ai/teachers-detect-gpt-4/", "https://affiliatemarketingforsuccess.com/ai/how-to-write-with-perplexity-ai/", "https://affiliatemarketingforsuccess.com/ai/turnitin-ai-detection-accuracy/", "https://affiliatemarketingforsuccess.com/ai/undetectable-ai-alternatives/", "https://affiliatemarketingforsuccess.com/ai/perplexity-jailbreak-prompts-2/", "https://affiliatemarketingforsuccess.com/affiliate-marketing/earn-generous-commissions-with-walmart-affiliate-program/", "https://affiliatemarketingforsuccess.com/affiliate-marketing/how-to-increase-your-affiliate-marketing-conversion-rate/", "https://affiliatemarketingforsuccess.com/ai/how-chat-gpt-will-change-education/", "https://affiliatemarketingforsuccess.com/email-marketing/getresponse-review-2025/", "https://affiliatemarketingforsuccess.com/affiliate-marketing/how-to-create-an-affiliate-marketing-strategy/", "https://affiliatemarketingforsuccess.com/ai/perplexity-model/", "https://affiliatemarketingforsuccess.com/email-marketing/proven-ways-to-grow-your-email-list/", "https://affiliatemarketingforsuccess.com/ai/undetectable-ai/", "https://affiliatemarketingforsuccess.com/review/use-fiverr-gigs-to-boost-your-business/", "https://affiliatemarketingforsuccess.com/seo/google-ranking-factors/", "https://affiliatemarketingforsuccess.com/ai/how-chat-gpt-is-different-from-google/", "https://affiliatemarketingforsuccess.com/blogging/a-guide-to-copyediting-vs-copywriting/", "https://affiliatemarketingforsuccess.com/email-marketing/craft-irresistible-email-newsletters/", "https://affiliatemarketingforsuccess.com/affiliate-marketing/affiliate-marketing-on-instagram/", "https://affiliatemarketingforsuccess.com/ai/integrate-perplexity-ai-affiliate-tech-stack/", "https://affiliatemarketingforsuccess.com/ai/affiliate-marketing-perplexity-ai-future/", "https://affiliatemarketingforsuccess.com/blogging/increase-domain-authority-quickly/", "https://affiliatemarketingforsuccess.com/review/wp-rocket-boost-wordpress-performance/", "https://affiliatemarketingforsuccess.com/affiliate-marketing/shein-affiliate-program-usa-fashionable-earnings-await-you/", "https://affiliatemarketingforsuccess.com/ai/auto-ai-transforming-industries-with-automation/", "https://affiliatemarketingforsuccess.com/ai/is-turnitin-free/", "https://affiliatemarketingforsuccess.com/review/getresponse-vs-clickfunnels/", "https://affiliatemarketingforsuccess.com/ai/autoblogging-ai-review/", "https://affiliatemarketingforsuccess.com/tools/affiliate-link-generator/", "https://affiliatemarketingforsuccess.com/ai/chatgpt-creative-writing-prompts/", "https://affiliatemarketingforsuccess.com/ai/undetectable-ai-review/", "https://affiliatemarketingforsuccess.com/ai/best-ai-detector/", "https://affiliatemarketingforsuccess.com/ai/ai-future-of-seo/", "https://affiliatemarketingforsuccess.com/review/clickfunnels-review/", "https://affiliatemarketingforsuccess.com/ai/chatgpt-plagiarize/", "https://affiliatemarketingforsuccess.com/ai/turnitin-detect-quillbot-paraphrasing/", "https://affiliatemarketingforsuccess.com/ai/use-turnitin-checker/", "https://affiliatemarketingforsuccess.com/ai/turnitin-read-images/", "https://affiliatemarketingforsuccess.com/ai/turnitin-ai-detection-free/", "https://affiliatemarketingforsuccess.com/ai/jobs-in-danger-due-to-gpt-4/", "https://affiliatemarketingforsuccess.com/ai/surfer-ai-review/", "https://affiliatemarketingforsuccess.com/tools/content-idea-generator/", "https://affiliatemarketingforsuccess.com/review/getresponse-vs-mailchimp/", "https://affiliatemarketingforsuccess.com/ai/turnitin-plagiarism/", "https://affiliatemarketingforsuccess.com/email-marketing/getresponse-vs-tinyemail/", "https://affiliatemarketingforsuccess.com/affiliate-marketing/struggling-with-wordpress/", "https://affiliatemarketingforsuccess.com/ai/learn-prompt-engineering/", "https://affiliatemarketingforsuccess.com/affiliate-marketing/how-to-promote-affiliate-products-without-a-website/", "https://affiliatemarketingforsuccess.com/ai/chatgpt-playground/", "https://affiliatemarketingforsuccess.com/ai/chatgpt-api/", "https://affiliatemarketingforsuccess.com/review/frase-review-2025/", "https://affiliatemarketingforsuccess.com/review/seowriting-ai-review/", "https://affiliatemarketingforsuccess.com/tools/seo-keyword-research-tool/", "https://affiliatemarketingforsuccess.com/tools/affiliate-program-comparison-tool/", "https://affiliatemarketingforsuccess.com/review/writesonic-review/", "https://affiliatemarketingforsuccess.com/blogging/content-marketing-must-educate-and-convert-the-customer/", "https://affiliatemarketingforsuccess.com/blogging/how-to-successfully-transition-into-copywriting/", "https://affiliatemarketingforsuccess.com/blogging/how-to-use-new-methods-to-capture-leads/", "https://affiliatemarketingforsuccess.com/blogging/update-old-blog-content/", "https://affiliatemarketingforsuccess.com/review/frase-io-vs-quillbot/", "https://affiliatemarketingforsuccess.com/blogging/testimonials-as-blog-content-in-2024/", "https://affiliatemarketingforsuccess.com/blogging/overcoming-blog-stagnation/", "https://affiliatemarketingforsuccess.com/seo/web-positioning-in-google/", "https://affiliatemarketingforsuccess.com/blogging/the-blogging-lifestyle/", "https://affiliatemarketingforsuccess.com/review/bramework-review/", "https://affiliatemarketingforsuccess.com/seo/how-will-voice-search-impact-your-seo-strategy/", "https://affiliatemarketingforsuccess.com/how-to-start/how-to-succeed-in-email-marketing/", "https://affiliatemarketingforsuccess.com/review/spreadsimple-review/", "https://affiliatemarketingforsuccess.com/ai/boost-affiliate-earnings-perplexity-ai/", "https://affiliatemarketingforsuccess.com/tools/script-timer-tool/", "https://affiliatemarketingforsuccess.com/ai/agility-writer-review/", "https://affiliatemarketingforsuccess.com/review/inkforall-review-2024/", "https://affiliatemarketingforsuccess.com/web-hosting/web-hosting-comparison/", "https://affiliatemarketingforsuccess.com/ai/is-chatgpt-down-what-happened-and-how-to-fix-it/", "https://affiliatemarketingforsuccess.com/review/namehero-hosting-review/", "https://affiliatemarketingforsuccess.com/review/katteb-review/", "https://affiliatemarketingforsuccess.com/blogging/wordpress-blogging-tips/", "https://affiliatemarketingforsuccess.com/review/neuronwriter-review/", "https://affiliatemarketingforsuccess.com/affiliate-marketing/how-quickly-can-i-make-money-with-affiliate-marketing/", "https://affiliatemarketingforsuccess.com/affiliate-marketing/step-by-step-in-affiliate-marketing/", "https://affiliatemarketingforsuccess.com/affiliate-marketing/the-costs-to-start-affiliate-marketing/", "https://affiliatemarketingforsuccess.com/blogging/grow-your-affiliate-marketing-blog/", "https://affiliatemarketingforsuccess.com/affiliate-marketing/affiliate-niche-selection-mistakes/", "https://affiliatemarketingforsuccess.com/affiliate-marketing/affiliate-marketing-reviews/", "https://affiliatemarketingforsuccess.com/affiliate-marketing/affiliate-marketing-tools/", "https://affiliatemarketingforsuccess.com/affiliate-marketing/digital-marketing-definition/", "https://affiliatemarketingforsuccess.com/affiliate-marketing/build-an-affiliate-marketing-business/", "https://affiliatemarketingforsuccess.com/affiliate-marketing/affiliate-marketing-success/", "https://affiliatemarketingforsuccess.com/affiliate-marketing/best-ai-affiliate-niches/", "https://affiliatemarketingforsuccess.com/affiliate-marketing/the-concepts-of-digital-marketing/", "https://affiliatemarketingforsuccess.com/affiliate-marketing/building-an-affiliate-marketing-website/", "https://affiliatemarketingforsuccess.com/affiliate-marketing/how-affiliate-marketing-works/", "https://affiliatemarketingforsuccess.com/affiliate-marketing/maximize-your-startup-potential-leverage-chatgpt-for-startups-with-expert-chatgpt-prompts/", "https://affiliatemarketingforsuccess.com/review/grammarly-premium-review-leveradge-your-writing/", "https://affiliatemarketingforsuccess.com/blogging/how-to-position-your-blog/", "https://affiliatemarketingforsuccess.com/blogging/how-to-quickly-generate-leads/", "https://affiliatemarketingforsuccess.com/blogging/what-is-the-best-structure-of-a-blog-post/", "https://affiliatemarketingforsuccess.com/ai/chatgpt-has-changed-seo-forever/", "https://affiliatemarketingforsuccess.com/blogging/8-tips-for-successful-copywriting/", "https://affiliatemarketingforsuccess.com/blogging/why-do-blogs-fail/", "https://affiliatemarketingforsuccess.com/ai/copywriting-frameworks/", "https://affiliatemarketingforsuccess.com/affiliate-marketing/how-long-it-takes-to-become-an-affiliate-marketer/", "https://affiliatemarketingforsuccess.com/make-money-online/business-models-to-make-money-online/", "https://affiliatemarketingforsuccess.com/review/blogify-ai-review/", "https://affiliatemarketingforsuccess.com/review/wpx-hosting-review/", "https://affiliatemarketingforsuccess.com/affiliate-marketing/affiliate-marketing-for-online-business/", "https://affiliatemarketingforsuccess.com/review/kinsta-wordpress-hosting-review/", "https://affiliatemarketingforsuccess.com/review/marketmuse-review/", "https://affiliatemarketingforsuccess.com/blogging/how-to-analyze-your-blogs-user-behavior-metrics/", "https://affiliatemarketingforsuccess.com/ai/prompt-engineering-examples/", "https://affiliatemarketingforsuccess.com/blogging/how-to-increase-your-online-sales-at-christmas/", "https://affiliatemarketingforsuccess.com/blogging/keys-to-creating-successful-content-on-your-blog/", "https://affiliatemarketingforsuccess.com/review/writesonic-vs-seowriting-ai/", "https://affiliatemarketingforsuccess.com/ai/perplexity-ai-revolutionize-affiliate-strategy/", "https://affiliatemarketingforsuccess.com/ai/perplexity-ai-affiliate-marketing/", "https://affiliatemarketingforsuccess.com/blogging/create-seo-friendly-blog-posts/", "https://affiliatemarketingforsuccess.com/ai/chatgpt-for-education/", "https://affiliatemarketingforsuccess.com/make-money-online/what-is-the-profile-of-a-successful-online-entrepreneur/", "https://affiliatemarketingforsuccess.com/ai/bard-vs-chatgpt-vs-grok/", "https://affiliatemarketingforsuccess.com/blogging/automate-your-blog-with-artificial-intelligence/", "https://affiliatemarketingforsuccess.com/info/how-to-screenshot-on-chromebook/", "https://affiliatemarketingforsuccess.com/ai/chatgpt-detected-by-safeassign/", "https://affiliatemarketingforsuccess.com/ai/turnitin-vs-grammarly/", "https://affiliatemarketingforsuccess.com/affiliate-marketing/what-are-impressions-in-advertising/", "https://affiliatemarketingforsuccess.com/blogging/11-things-to-outsource-as-a-blogger-for-more-time-and-efficiency/", "https://affiliatemarketingforsuccess.com/email-marketing/email-list-for-affiliate-marketing/", "https://affiliatemarketingforsuccess.com/review/copy-ai-vs-katteb/", "https://affiliatemarketingforsuccess.com/how-to-start/google-ranking-factors-seo-strategy/", "https://affiliatemarketingforsuccess.com/make-money-online/how-to-make-money-writing-articles-online/", "https://affiliatemarketingforsuccess.com/blogging/best-topics-on-your-digital-marketing-blog/", "https://affiliatemarketingforsuccess.com/web-hosting/digitalocean-review/", "https://affiliatemarketingforsuccess.com/blogging/top-challenges-a-blogger-faces/", "https://affiliatemarketingforsuccess.com/blogging/how-to-boost-the-ranking-of-an-existing-page-on-search-engines/", "https://affiliatemarketingforsuccess.com/blogging/create-your-personal-blog/", "https://affiliatemarketingforsuccess.com/ai/chatgpt-vs-competing-language-models/", "https://affiliatemarketingforsuccess.com/info/paraphrase-text-using-nlp/", "https://affiliatemarketingforsuccess.com/review/pictory-ai-review/", "https://affiliatemarketingforsuccess.com/affiliate-marketing/how-to-track-and-measure-your-affiliate-marketing-performance/", "https://affiliatemarketingforsuccess.com/affiliate-marketing/how-to-use-seo-for-affiliate-marketing/", "https://affiliatemarketingforsuccess.com/seo/mastering-seo-best-practices/", "https://affiliatemarketingforsuccess.com/affiliate-marketing/how-much-time-it-takes-to-earn-from-affiliate-marketing/", "https://affiliatemarketingforsuccess.com/blogging/google-pagespeed-insights/", "https://affiliatemarketingforsuccess.com/blogging/the-imposter-syndrome/", "https://affiliatemarketingforsuccess.com/blogging/lead-nurturing/", "https://affiliatemarketingforsuccess.com/affiliate-marketing/affiliate-marketing-vs-dropshipping/", "https://affiliatemarketingforsuccess.com/affiliate-marketing/how-to-make-money-with-affiliate-marketing/", "https://affiliatemarketingforsuccess.com/seo/the-importance-of-seo-for-your-blog/", "https://affiliatemarketingforsuccess.com/how-to-start/criteria-for-profitable-affiliate-niches/", "https://affiliatemarketingforsuccess.com/ai/chatgpt-give-same-answers/", "https://affiliatemarketingforsuccess.com/affiliate-marketing/why-affiliate-marketers-fail/", "https://affiliatemarketingforsuccess.com/ai/winston-detect-quillbot/", "https://affiliatemarketingforsuccess.com/ai/quillbot-bypass-ai-detection/", "https://affiliatemarketingforsuccess.com/ai/how-chatgpt-gets-information/", "https://affiliatemarketingforsuccess.com/email-marketing/effective-email-marketing-strategies/", "https://affiliatemarketingforsuccess.com/ai/semantic-clustering-in-seo/", "https://affiliatemarketingforsuccess.com/ai/semantic-clustering-tools/", "https://affiliatemarketingforsuccess.com/blogging/how-to-write-niche-specific-content/", "https://affiliatemarketingforsuccess.com/make-money-online/optimize-your-sales-funnel/", "https://affiliatemarketingforsuccess.com/affiliate-marketing/best-affiliate-marketing-niches-2025/", "https://affiliatemarketingforsuccess.com/affiliate-marketing/how-to-start-an-affiliate-marketing-blog/", "https://affiliatemarketingforsuccess.com/blogging/how-to-setup-the-basic-seo-technical-foundations-for-your-blog/", "https://affiliatemarketingforsuccess.com/blogging/long-term-content-strategy/", "https://affiliatemarketingforsuccess.com/ai/how-chatgpt-works/", "https://affiliatemarketingforsuccess.com/ai/prompt-engineering-nlp/", "https://affiliatemarketingforsuccess.com/ai/prompt-engineering-course/", "https://affiliatemarketingforsuccess.com/ai/prompt-engineering-ai-art/", "https://affiliatemarketingforsuccess.com/review/semrush-review-2025/", "https://affiliatemarketingforsuccess.com/affiliate-marketing/top-10-affiliate-marketing-trends-in-2025/", "https://affiliatemarketingforsuccess.com/affiliate-marketing/launch-affiliate-business-ai-tools/", "https://affiliatemarketingforsuccess.com/blogging/monetize-your-blog-proven-strategies/", "https://affiliatemarketingforsuccess.com/ai/ethical-implications-of-ai/", "https://affiliatemarketingforsuccess.com/web-hosting/siteground-web-hosting-review-2025/", "https://affiliatemarketingforsuccess.com/ai/deepseek-r1-vs-chatgpt/", "https://affiliatemarketingforsuccess.com/ai/prompt-engineering-jobs/", "https://affiliatemarketingforsuccess.com/ai/perplexity-ai/", "https://affiliatemarketingforsuccess.com/review/the-ultimate-jasper-ai-review/", "https://affiliatemarketingforsuccess.com/affiliate-marketing/how-to-use-social-media-for-affiliate-marketing/", "https://affiliatemarketingforsuccess.com/ai/chatgpt-use-cases/", "https://affiliatemarketingforsuccess.com/seo/the-importance-of-keywords-research/", "https://affiliatemarketingforsuccess.com/ai/ai-prompt-writing/", "https://affiliatemarketingforsuccess.com/blogging/what-is-copywriting-promotes-advertises-or-entertains/", "https://affiliatemarketingforsuccess.com/blogging/how-to-write-a-high-ranking-blog-post/", "https://affiliatemarketingforsuccess.com/affiliate-marketing/generative-ai/", "https://affiliatemarketingforsuccess.com/how-to-start/how-to-register-a-domain-name/", "https://affiliatemarketingforsuccess.com/chatgpt-prompts/chatgpt-prompts-for-marketing/", "https://affiliatemarketingforsuccess.com/affiliate-marketing/how-many-affiliate-programs-should-i-join-guide/", "https://affiliatemarketingforsuccess.com/how-to-start/top-10-pro-tips-for-choosing-affiliate-marketing-programs/", "https://affiliatemarketingforsuccess.com/affiliate-marketing/optimize-your-affiliate-marketing-website-for-seo/", "https://affiliatemarketingforsuccess.com/affiliate-marketing/how-to-use-youtube-for-affiliate-marketing/", "https://affiliatemarketingforsuccess.com/ai/ai-affiliate-marketing-strategies-2025/", "https://affiliatemarketingforsuccess.com/review/quillbot-review/", "https://affiliatemarketingforsuccess.com/how-to-start/how-to-choose-your-niche/", "https://affiliatemarketingforsuccess.com/affiliate-marketing/how-to-make-money-with-amazon-affiliate-marketing/", "https://affiliatemarketingforsuccess.com/ai/best-chatgpt-alternatives-for-2025/", "https://affiliatemarketingforsuccess.com/how-to-start/most-suitable-affiliate-program/", "https://affiliatemarketingforsuccess.com/seo/seo-writing-a-complete-guide-to-seo-writing/", "https://affiliatemarketingforsuccess.com/how-to-start/the-truth-about-web-hosting/", "https://affiliatemarketingforsuccess.com/ai/chatgpt-prompt-engineering/", "https://affiliatemarketingforsuccess.com/blogging/storytelling-in-content-marketing/", "https://affiliatemarketingforsuccess.com/tools/email-marketing-template-generator/", "https://affiliatemarketingforsuccess.com/affiliate-marketing/affiliate-marketing-mistakes/", "https://affiliatemarketingforsuccess.com/seo/keyword-stemming/", "https://affiliatemarketingforsuccess.com/ai/multimodal-ai-models-guide/", "https://affiliatemarketingforsuccess.com/ai/large-language-models-comparison-2025/", "https://affiliatemarketingforsuccess.com/ai/gpt-4o-vs-gemini/", "https://affiliatemarketingforsuccess.com/ai/multimodal-prompt-engineering/", "https://affiliatemarketingforsuccess.com/ai/claude-4-guide/", "https://affiliatemarketingforsuccess.com/seo/programmatic-seo/", "https://affiliatemarketingforsuccess.com/blogging/blogging-mistakes-marketers-make/", "https://affiliatemarketingforsuccess.com/seo/why-your-current-seo-strategy-is-failing/", "https://affiliatemarketingforsuccess.com/blogging/how-to-brand-storytelling/", "https://affiliatemarketingforsuccess.com/seo/doing-an-seo-audit/", "https://affiliatemarketingforsuccess.com/tools/commission-calculator/", "https://affiliatemarketingforsuccess.com/blogging/essential-tools-for-a-blogger/", "https://affiliatemarketingforsuccess.com/blogging/types-of-evergreen-content/", "https://affiliatemarketingforsuccess.com/affiliate-marketing/affiliate-marketing-strategies/", "https://affiliatemarketingforsuccess.com/review/cloudways-review-2025/", "https://affiliatemarketingforsuccess.com/affiliate-marketing/the-power-of-ai-in-seo/", "https://affiliatemarketingforsuccess.com/ai/artificial-intelligence-machine-learning-revolutionizing-the-future/", "https://affiliatemarketingforsuccess.com/affiliate-marketing/keys-to-successful-affiliate-marketing/", "https://affiliatemarketingforsuccess.com/seo/improve-your-ranking-in-seo/", "https://affiliatemarketingforsuccess.com/blogging/reduce-bounce-rate/", "https://affiliatemarketingforsuccess.com/blogging/what-is-a-creative-copywriter/", "https://affiliatemarketingforsuccess.com/ai/chatgpt4-vs-gemini-pro-in-blog-writing/", "https://affiliatemarketingforsuccess.com/blogging/build-a-blogging-business-from-scratch/", "https://affiliatemarketingforsuccess.com/affiliate-marketing/the-ultimate-guide-to-affiliate-marketing/", "https://affiliatemarketingforsuccess.com/email-marketing/convertkit-pricing/", "https://affiliatemarketingforsuccess.com/affiliate-marketing/best-affiliate-products-to-promote/", "https://affiliatemarketingforsuccess.com/make-money-online/how-to-make-money-with-clickbank-the-ultimate-guide/", "https://affiliatemarketingforsuccess.com/seo/link-building-strategies/", "https://affiliatemarketingforsuccess.com/affiliate-marketing/affiliate-marketing-on-pinterest/", "https://affiliatemarketingforsuccess.com/blogging/blog-monetization-strategies/", "https://affiliatemarketingforsuccess.com/affiliate-marketing/why-is-affiliate-marketing-so-hard/", "https://affiliatemarketingforsuccess.com/ai/originality-ai-review/", "https://affiliatemarketingforsuccess.com/ai/how-chatbot-helps-developers/", "https://affiliatemarketingforsuccess.com/info/how-to-make-a-social-media-marketing-plan/", "https://affiliatemarketingforsuccess.com/blogging/countless-benefits-of-blogging/", "https://affiliatemarketingforsuccess.com/ai/the-anthropic-prompt-engineer/", "https://affiliatemarketingforsuccess.com/ai/nvidia-ai/", "https://affiliatemarketingforsuccess.com/chatgpt-prompts/awesome-chatgpt-prompts/", "https://affiliatemarketingforsuccess.com/ai/ai-powered-semantic-clustering/", "https://affiliatemarketingforsuccess.com/ai/semantic-clustering-techniques/", "https://affiliatemarketingforsuccess.com/ai/benefits-of-semantic-clustering/"
];

interface ErrorBoundaryProps {
    children: React.ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

// A professional-grade Error Boundary to prevent blank screens
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // You can also log the error to an error reporting service
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="error-boundary">
          <h2>Something went wrong.</h2>
          <p>An unexpected error occurred which prevented this section from loading. Please try refreshing the page or contact support if the issue persists.</p>
          <details style={{ marginTop: '1rem', cursor: 'pointer' }}>
            <summary>Error Details</summary>
            <pre>
              {this.state.error && this.state.error.toString()}
            </pre>
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}


const PageHeader = ({ title, description }) => (
    <div className="page-header">
        <h2>{title}</h2>
        <p>{description}</p>
    </div>
);

const Sidebar = ({ currentStep, onNavigate, canNavigate }) => {
    const navItems = [
        { id: 1, label: "Configuration", icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.108 1.204.165.397.505.71.93.78l.894.15c.542.09.94.56.94 1.109v1.094c0 .55-.398 1.02-.94 1.11l-.894.149c-.424.07-.764.383-.93.78-.164.398-.142.854.108 1.204l.527.738c.32.447.27.96-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.78.93l-.15.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.149-.894a1.125 1.125 0 01-.93-.78c-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-.96.27-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.272.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149a1.125 1.125 0 01.93-.78c.398-.164.854-.142 1.204-.108l.738.527c.447.32.96.27 1.45.12l.773-.774a1.125 1.125 0 011.449-.12l.738.527c.35.25.806.272 1.203.107.397-.165.71-.505.78-.93l.15-.894z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
        { id: 2, label: "Content Hub", icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg> },
        { id: 3, label: "Review & Publish", icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg> }
    ];

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <div className="logo">🚀</div>
                <h1>WP Optimizer Pro</h1>
            </div>
            <nav className="sidebar-nav">
                <ul>
                    {navItems.map(item => (
                        <li key={item.id}>
                            <a href="#"
                               onClick={(e) => { e.preventDefault(); if(canNavigate) onNavigate(item.id); }}
                               className={`${currentStep === item.id ? 'active' : ''} ${!canNavigate && item.id > 1 ? 'disabled' : ''}`}
                            >
                                {item.icon}
                                {item.label}
                            </a>
                        </li>
                    ))}
                </ul>
            </nav>
            <div className="sidebar-footer">
                <p>&copy; {new Date().getFullYear()}<br />
                <a href="https://affiliatemarketingforsuccess.com/" target="_blank" rel="noopener noreferrer">
                    AffiliateMarketingForSuccess.com
                </a>
                </p>
            </div>
        </aside>
    );
};

const BottomNav = ({ currentStep, onNavigate, canNavigate }) => {
    const navItems = [
        { id: 1, label: "Config", icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.108 1.204.165.397.505.71.93.78l.894.15c.542.09.94.56.94 1.109v1.094c0 .55-.398 1.02-.94 1.11l-.894.149c-.424.07-.764.383-.93.78-.164.398-.142.854.108 1.204l.527.738c.32.447.27.96-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.78.93l-.15.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.149-.894a1.125 1.125 0 01-.93-.78c-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-.96.27-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.272.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149a1.125 1.125 0 01.93-.78c.398-.164.854-.142 1.204-.108l.738.527c.447.32.96.27 1.45.12l.773-.774a1.125 1.125 0 011.449-.12l.738.527c.35.25.806.272 1.203.107.397-.165.71-.505.78-.93l.15-.894z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
        { id: 2, label: "Content", icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg> },
        { id: 3, label: "Review", icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg> }
    ];
    return (
        <nav className="bottom-nav">
            {navItems.map(item => (
                <a href="#"
                   key={item.id}
                   onClick={(e) => { e.preventDefault(); if (canNavigate) onNavigate(item.id); }}
                   className={`bottom-nav-item ${currentStep === item.id ? 'active' : ''} ${!canNavigate && item.id > 1 ? 'disabled' : ''}`}
                >
                    {item.icon}
                    <span>{item.label}</span>
                </a>
            ))}
        </nav>
    );
};


const ApiKeyValidator = ({ status }) => {
    if (status === 'validating') {
        return <div className="key-status-icon"><div className="key-status-spinner"></div></div>;
    }
    if (status === 'valid') {
        return <div className="key-status-icon success"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg></div>;
    }
    if (status === 'invalid') {
        return <div className="key-status-icon error"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg></div>;
    }
    return null;
};


const PromotionalArticles = () => {
    const [articles, setArticles] = useState([]);

    useEffect(() => {
        const getTitleFromUrl = (url) => {
            try {
                const path = new URL(url).pathname;
                const slug = path.split('/').filter(Boolean).pop() || '';
                return slug.replace(/-/g, ' ')
                           .replace(/\b\w/g, l => l.toUpperCase());
            } catch (e) {
                return "Featured Article";
            }
        };

        const shuffled = [...SITE_PROMOTION_URLS].sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, 4).map(url => ({
            url,
            title: getTitleFromUrl(url)
        }));
        setArticles(selected);
    }, []);

    if (articles.length === 0) return null;

    return (
        <div className="promo-articles-section">
            <h3>From Our Blog: Winning Content Strategies</h3>
            <div className="promo-articles-grid">
                {articles.map(article => (
                    <a key={article.url} href={article.url} target="_blank" rel="noopener noreferrer" className="promo-article-card">
                        <h4>{article.title}</h4>
                        <p>Read More &rarr;</p>
                    </a>
                ))}
            </div>
        </div>
    );
};

const PromoBanner = () => (
    <div className="promo-banner">
        <h3>Dominate Your Niche with an Unfair Advantage</h3>
        <p><strong>The Sizzle:</strong> We don't just offer tools; we deliver an integrated AI-powered ecosystem that builds lasting Topical Authority, making your content the definitive source in your field.</p>
        <a href="https://seo-hub.affiliatemarketingforsuccess.com/" target="_blank" rel="noopener noreferrer" className="btn">
            Discover the SEO Hub
        </a>
    </div>
);


const ConfigStep = ({ state, dispatch, onFetchSitemap, onValidateKey, onVerifyWpConnection }) => {
    const { wpUrl, wpUser, wpPassword, sitemapUrl, urlLimit, loading, aiProvider, apiKeys, openRouterModel, keyStatus, wpConnectionStatus, wpConnectionError, wpUserRoles } = state;
    const isSitemapConfigValid = useMemo(() => sitemapUrl && sitemapUrl.trim() !== '', [sitemapUrl]);
    
    const isApiKeyValid = useMemo(() => {
        const keyIsEntered = apiKeys[aiProvider] && apiKeys[aiProvider].trim() !== '';
        return keyIsEntered && keyStatus[aiProvider] !== 'invalid';
    }, [apiKeys, aiProvider, keyStatus]);

    const isWpConfigured = useMemo(() => wpUrl && wpUser && wpPassword, [wpUrl, wpUser, wpPassword]);

    const [saveConfig, setSaveConfig] = useState(false);

    // Effect to load config from localStorage ONCE on mount, with robust error handling
    useEffect(() => {
        const saved = localStorage.getItem('wpOptimizerConfig');
        if (saved) {
            try {
                const config = JSON.parse(saved);
                if (config && typeof config === 'object') {
                    const payload: any = {};
                    if (typeof config.wpUrl === 'string') payload.wpUrl = config.wpUrl;
                    if (typeof config.wpUser === 'string') payload.wpUser = config.wpUser;
                    if (typeof config.sitemapUrl === 'string') payload.sitemapUrl = config.sitemapUrl;
                    if (typeof config.urlLimit === 'number') payload.urlLimit = config.urlLimit;
                    if (typeof config.aiProvider === 'string' && ['gemini', 'openai', 'claude', 'openrouter'].includes(config.aiProvider)) payload.aiProvider = config.aiProvider;
                    if (config.apiKeys && typeof config.apiKeys === 'object') {
                        payload.apiKeys = {
                            gemini: String(config.apiKeys.gemini || ''),
                            openai: String(config.apiKeys.openai || ''),
                            claude: String(config.apiKeys.claude || ''),
                            openrouter: String(config.apiKeys.openrouter || ''),
                        };
                    }
                    if (typeof config.openRouterModel === 'string') payload.openRouterModel = config.openRouterModel;

                    dispatch({ type: 'SET_CONFIG', payload });
                    setSaveConfig(true);
                } else {
                     throw new Error("Saved config is not a valid object.");
                }
            } catch (error) {
                console.error("Failed to parse or apply saved config, clearing it.", error);
                localStorage.removeItem('wpOptimizerConfig');
            }
        }
    }, [dispatch]);

    const debouncedSave = useCallback(debounce((configToSave) => {
        localStorage.setItem('wpOptimizerConfig', JSON.stringify(configToSave));
    }, 1000), []);

    useEffect(() => {
        if (saveConfig) {
            const configToSave = { wpUrl, wpUser, sitemapUrl, urlLimit, aiProvider, apiKeys, openRouterModel };
            debouncedSave(configToSave);
        }
    }, [wpUrl, wpUser, sitemapUrl, urlLimit, aiProvider, apiKeys, openRouterModel, saveConfig, debouncedSave]);

    const handleSaveToggle = (e) => {
        const checked = e.target.checked;
        setSaveConfig(checked);
        if (!checked) {
            localStorage.removeItem('wpOptimizerConfig');
        }
    };

    const handleClearConfig = () => {
        localStorage.removeItem('wpOptimizerConfig');
        dispatch({ type: 'RESET_CONFIG' });
        setSaveConfig(false);
    };

    const debouncedValidate = useCallback(debounce(onValidateKey, 500), [onValidateKey]);

    const handleApiKeyChange = (provider, value) => {
        dispatch({ type: 'UPDATE_API_KEY', payload: { provider, key: value } });
        if (value) {
            dispatch({ type: 'SET_KEY_STATUS', payload: { provider, status: 'validating' } });
            debouncedValidate(provider, value);
        } else {
            dispatch({ type: 'SET_KEY_STATUS', payload: { provider, status: 'idle' } });
        }
    };

    const handleChange = (e) => {
        dispatch({ type: 'UPDATE_FIELD', payload: { field: e.target.id, value: e.target.value } });
    };

    const renderConnectionStatus = () => {
        if (wpConnectionStatus === 'idle') return null;
        
        const isLowPermissionRole = wpUserRoles.length > 0 && !wpUserRoles.includes('administrator') && !wpUserRoles.includes('editor');

        const isAuthError = wpConnectionError.includes('You are not currently logged in.');

        return (
            <div className={`result ${wpConnectionStatus === 'error' ? 'error' : 'success'}`} style={{ marginTop: '1.5rem' }}>
                {wpConnectionStatus === 'verifying' && <p>Verifying connection...</p>}
                {wpConnectionStatus === 'error' && (
                    <>
                        <p style={{ margin: 0 }}><strong>Connection Failed</strong></p>
                        {isAuthError ? (
                            <p className="help-text" style={{color: 'inherit', marginTop: '0.5rem'}}>
                                This is usually caused by an incorrect Username or Application Password.
                                Please ensure you are using an <strong>Application Password</strong>, not your regular WordPress login password.
                                <a href="https://wordpress.org/documentation/article/application-passwords/" target="_blank" rel="noopener noreferrer" style={{color: 'inherit', fontWeight: 'bold', marginLeft: '4px'}}>
                                    Learn how to create one here.
                                </a>
                            </p>
                        ) : (
                            <p className="help-text" style={{color: 'inherit', marginTop: '0.5rem'}}>{wpConnectionError}</p>
                        )}
                    </>
                )}
                {wpConnectionStatus === 'success' && (
                    <>
                        <p style={{ margin: 0 }}>✅ <strong>Connection successful.</strong> Role(s): {wpUserRoles.join(', ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                        {isLowPermissionRole && (
                             <p className="help-text" style={{color: 'inherit', marginTop: '0.5rem'}}>
                                Your '{wpUserRoles[0]}' role may have limitations (e.g., unable to upload images or edit others' posts). An 'Editor' or 'Administrator' role is recommended for full functionality.
                            </p>
                        )}
                    </>
                )}
            </div>
        );
    };


    return (
        <div className="step-container" id="step-1-config">
            <PageHeader title="Configuration" description="Connect your WordPress site, configure your AI provider, and set up your sitemap to get started." />
            
            <PromoBanner />
            
            <fieldset className="config-fieldset">
                <legend>WordPress Configuration</legend>
                <div className="form-group">
                    <label htmlFor="wpUrl">WordPress Site URL</label>
                    <input type="url" id="wpUrl" value={wpUrl} onChange={handleChange} placeholder="https://example.com" required />
                </div>
                 <div className="form-group">
                    <label htmlFor="wpUser">WordPress Username</label>
                    <input type="text" id="wpUser" value={wpUser} onChange={handleChange} placeholder="your_username" required />
                </div>
                <div className="form-group">
                    <label htmlFor="wpPassword">WordPress Application Password</label>
                    <input type="password" id="wpPassword" value={wpPassword} onChange={handleChange} placeholder="xxxx xxxx xxxx xxxx" required />
                    <p className="help-text">Generate this in your WP admin under Users &gt; Profile &gt; Application Passwords. <a href="https://wordpress.org/documentation/article/application-passwords/" target="_blank" rel="noopener noreferrer">Learn More</a></p>
                </div>
                <div className="form-group">
                    <button onClick={onVerifyWpConnection} className="btn btn-secondary" style={{width: 'auto'}} disabled={loading.wpConnection || !isWpConfigured}>
                        {loading.wpConnection ? 'Verifying...' : 'Verify Connection'}
                    </button>
                </div>
                {renderConnectionStatus()}
            </fieldset>

            <fieldset className="config-fieldset">
                <legend>AI Provider Configuration</legend>
                <div className="form-group">
                    <label htmlFor="aiProvider">AI Provider</label>
                    <select id="aiProvider" value={aiProvider} onChange={e => dispatch({ type: 'SET_AI_PROVIDER', payload: e.target.value })}>
                        <option value="gemini">Google Gemini</option>
                        <option value="openai">OpenAI</option>
                        <option value="claude">Anthropic Claude</option>
                        <option value="openrouter">OpenRouter</option>
                    </select>
                </div>
                 <div className="form-group api-key-group">
                    <label htmlFor={`${aiProvider}ApiKey`}>{aiProvider.charAt(0).toUpperCase() + aiProvider.slice(1)} API Key</label>
                    <input
                        type="password"
                        id={`${aiProvider}ApiKey`}
                        value={apiKeys[aiProvider] || ''}
                        onChange={(e) => handleApiKeyChange(aiProvider, e.target.value)}
                        placeholder={`Enter your ${aiProvider} API Key`}
                        required
                    />
                    <ApiKeyValidator status={keyStatus[aiProvider]} />
                </div>
                {aiProvider === 'openrouter' && (
                     <div className="form-group">
                        <label htmlFor="openRouterModel">OpenRouter Model String</label>
                        <input type="text" id="openRouterModel" value={openRouterModel} onChange={e => dispatch({type: 'UPDATE_FIELD', payload: {field: 'openRouterModel', value: e.target.value }})} placeholder="e.g., google/gemini-2.5-flash" />
                        <p className="help-text">Find model strings on the OpenRouter models page.</p>
                    </div>
                )}
            </fieldset>

            <fieldset className="config-fieldset">
                <legend>Sitemap Configuration</legend>
                 <div className="form-group">
                    <label htmlFor="sitemapUrl">Sitemap URL (or Sitemap Index URL)</label>
                    <input type="url" id="sitemapUrl" value={sitemapUrl} onChange={handleChange} placeholder="https://affiliatemarketingforsuccess.com/sitemap.xml" required />
                </div>
                <div className="form-group">
                    <label htmlFor="urlLimit">Max URLs to process from sitemap</label>
                    <input type="number" id="urlLimit" value={urlLimit} onChange={e => dispatch({type: 'UPDATE_FIELD', payload: {field: 'urlLimit', value: parseInt(e.target.value, 10) }})} />
                </div>
            </fieldset>

             <div className="checkbox-group">
                <input type="checkbox" id="saveConfig" checked={saveConfig} onChange={handleSaveToggle} />
                <label htmlFor="saveConfig">Save configuration (excluding passwords)</label>
            </div>
            {saveConfig && <button onClick={handleClearConfig} className="btn btn-secondary" style={{ marginTop: '1rem', width: 'auto'}}>Clear Saved Config</button>}
            
            <div className="button-group" style={{marginTop: '2rem'}}>
                <button onClick={() => onFetchSitemap(false)} className="btn btn-secondary" disabled={loading.sitemap || !isApiKeyValid || wpConnectionStatus !== 'success'}>
                    Proceed without Sitemap
                </button>
                <button onClick={() => onFetchSitemap(true)} className="btn" disabled={loading.sitemap || !isSitemapConfigValid || !isApiKeyValid || wpConnectionStatus !== 'success'}>
                    {loading.sitemap ? 'Fetching...' : 'Fetch Sitemap & Proceed'}
                </button>
            </div>
        </div>
    );
};

const BatchGenerationView = ({ jobs, topics, isLoading, onGenerate, onReviewItem, dispatch }) => {
    const totalJobs = jobs.length;
    const completedJobs = jobs.filter(j => j.status === 'done').length;
    const erroredJobs = jobs.filter(j => j.status === 'error').length;
    const processingJobsCount = jobs.filter(j => j.status === 'processing').length;
    const queuedJobs = jobs.filter(j => j.status === 'queued').length;
    const topicsCount = topics.split('\n').filter(t => t.trim()).length;
    const progressPercent = totalJobs > 0 ? ((completedJobs + erroredJobs) / totalJobs) * 100 : 0;

    return (
        <div className="create-new-form">
            <h3>Batch Post Generation</h3>
            <p className="help-text">Enter one blog post title or topic per line. The AI will generate a full article for each.</p>
            <div className="form-group">
                <div className="label-wrapper">
                    <label htmlFor="batchTopics">Topics for Generation</label>
                    <span className="input-adornment">{topicsCount} topic{topicsCount !== 1 ? 's' : ''}</span>
                </div>
                <textarea 
                    id="batchTopics" 
                    value={topics}
                    onChange={e => dispatch({ type: 'SET_BATCH_TOPICS', payload: e.target.value })}
                    placeholder="Example: The Ultimate Guide to SEO in 2025&#10;How to Start Affiliate Marketing for Beginners&#10;Top 10 AI tools for Content Creators"
                    disabled={isLoading}
                    rows={8}
                ></textarea>
            </div>
            <div className="button-group" style={{marginTop: '0.5rem', marginBottom: '1.5rem'}}>
                <button onClick={onGenerate} className="btn" disabled={isLoading || !topics.trim()}>
                    {isLoading 
                        ? `Generating...`
                        : `Generate ${topicsCount > 0 ? topicsCount : ''} Posts`
                    }
                </button>
                <button onClick={() => dispatch({ type: 'SET_BATCH_TOPICS', payload: '' })} className="btn btn-secondary" disabled={isLoading || !topics.trim()}>Clear Topics</button>
            </div>
            
            {jobs.length > 0 && (
                <div className="batch-jobs-progress">
                    <div className="batch-progress-header">
                         <h5>Generation Progress</h5>
                         <span className="batch-progress-stats">{completedJobs + erroredJobs} / {totalJobs} Complete</span>
                    </div>
                    <div className="progress-bar-container">
                         <div className="progress-bar" style={{ width: `${progressPercent}%` }}></div>
                    </div>
                    <div className="batch-stats-grid">
                        <div className="stat-item"><span>{completedJobs}</span> ✅ Done</div>
                        <div className="stat-item"><span>{erroredJobs}</span> ❌ Error</div>
                        <div className="stat-item"><span>{processingJobsCount}</span> ⚙️ Processing</div>
                        <div className="stat-item"><span>{queuedJobs}</span> 🕒 Queued</div>
                    </div>

                    <div className="batch-jobs-list">
                        {jobs.map(job => (
                            <div key={job.id} className={`batch-job-item status-${job.status}`}>
                                <div className="job-status-icon">
                                    {job.status === 'queued' && '🕒'}
                                    {job.status === 'processing' && <div className="keyword-loading-spinner"></div>}
                                    {job.status === 'done' && '✅'}
                                    {job.status === 'error' && '❌'}
                                </div>
                                <div className="job-details">
                                    <p className="job-title">{job.title}</p>
                                    {job.status === 'error' && <p className="job-error" title={String(job.result)}>{String(job.result)}</p>}
                                </div>
                                {job.status === 'done' && (
                                    <button className="btn btn-small" onClick={() => onReviewItem(job)}>Review & Publish</button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

const ContentStep = ({ state, dispatch, onGenerateContent, onFetchWpPosts, onAnalyzeAndSelect, onGeneratePostIdeas, onGenerateBatch, onLoadBatchResultForReview, onGenerateClusterPlan, onGenerateClusterArticles, onProcessFullCluster, onDiscoverClusters, onOptimizeClusterPost, onBulkUpdate }) => {
    const { rawContent, loading, wpPosts, postToUpdate, wpConnectionStatus, postIdeas, fetchedUrls, batchTopics, batchJobs, clusterTopic, clusterPlan, suggestedClusters, isMultiSelectMode, selectedPosts } = state;
    
    // UI State
    const [activeView, setActiveView] = useState('welcome'); // 'welcome', 'new', 'edit', 'batch', 'cluster', 'clusterPlan', 'discover'

    // Post List State
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'modified', direction: 'descending' });
    const [hideUpdated, setHideUpdated] = useState(false);

    useEffect(() => {
        if (postToUpdate) {
            setActiveView('edit');
        } else if (clusterPlan) {
            setActiveView('clusterPlan');
        } else if (!postToUpdate && activeView === 'edit') {
            setActiveView('welcome');
        }
    }, [postToUpdate, clusterPlan]);
    
    const handleCreateNewClick = () => {
        dispatch({ type: 'CLEAR_UPDATE_SELECTION' });
        dispatch({ type: 'CLEAR_CLUSTER_PLAN' });
        setActiveView('new');
        
        const workspace = document.getElementById('workspace-container');
        if(workspace) {
            workspace.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };
    
    const handleCreateBatchClick = () => {
         dispatch({ type: 'CLEAR_UPDATE_SELECTION' });
         dispatch({ type: 'CLEAR_CLUSTER_PLAN' });
         setActiveView('batch');
    }
    
    const handleClusterClick = () => {
        dispatch({ type: 'CLEAR_UPDATE_SELECTION' });
        setActiveView('cluster');
    };

    const handleDiscoverClick = () => {
        dispatch({ type: 'CLEAR_UPDATE_SELECTION' });
        setActiveView('discover');
    };

    const handleToggleMultiSelect = () => {
        dispatch({ type: 'TOGGLE_MULTI_SELECT_MODE' });
    };

    const handlePostSelection = (postId) => {
        dispatch({ type: 'TOGGLE_POST_SELECTION', payload: postId });
    };
    
    const handlePostRowClick = (post) => {
        if (isMultiSelectMode) {
            handlePostSelection(post.id);
            return;
        }
        if (!post.canEdit || post.status === 'loading' || post.id === postToUpdate) return;
        onAnalyzeAndSelect(post);
        
        const workspace = document.getElementById('workspace-container');
        if(workspace) {
            workspace.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    const handleBatchItemReview = (job) => {
        onLoadBatchResultForReview(job.result);
    };
    
    const getPostStatus = (post) => {
        if (!post.canEdit) return { text: 'Locked', className: 'status-locked', sort: 4 };
        if (post.id === postToUpdate) return { text: 'Editing', className: 'status-editing', sort: 0 };
        if (post.updatedInSession) return { text: 'Updated', className: 'status-updated', sort: 2 };
        if (post.status === 'loading') return { text: 'Analyzing', className: 'status-loading', sort: 1 };
        return { text: 'Ready', className: 'status-ready', sort: 3 };
    };

    const sortedAndFilteredPosts = useMemo(() => {
        if (!wpPosts) return [];
        let modifiablePosts = [...wpPosts];

        if (hideUpdated) {
            modifiablePosts = modifiablePosts.filter(post => !post.updatedInSession);
        }
        if (searchTerm) {
            modifiablePosts = modifiablePosts.filter(post => post.title.rendered.toLowerCase().includes(searchTerm.toLowerCase()));
        }

        if (sortConfig.key) {
            modifiablePosts.sort((a, b) => {
                let aValue, bValue;

                switch(sortConfig.key) {
                    case 'status':
                        aValue = getPostStatus(a).sort;
                        bValue = getPostStatus(b).sort;
                        break;
                    case 'title':
                        aValue = a.title.rendered.toLowerCase();
                        bValue = b.title.rendered.toLowerCase();
                        break;
                    case 'keyword':
                        aValue = a.keyword?.toLowerCase() || '';
                        bValue = b.keyword?.toLowerCase() || '';
                        break;
                    case 'wordCount':
                        aValue = a.wordCount ?? -1;
                        bValue = b.wordCount ?? -1;
                        break;
                    case 'date':
                        aValue = new Date(a.date).getTime();
                        bValue = new Date(b.date).getTime();
                        break;
                    case 'modified':
                        aValue = new Date(a.modified).getTime();
                        bValue = new Date(b.modified).getTime();
                        break;
                    default:
                        return 0;
                }

                if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }
        return modifiablePosts;
    }, [wpPosts, searchTerm, sortConfig, hideUpdated, postToUpdate]);
    
    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const getSortIndicator = (key) => {
        if (sortConfig.key !== key) return '↕️';
        return sortConfig.direction === 'ascending' ? '🔼' : '🔽';
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            const allVisibleIds = sortedAndFilteredPosts.map(p => p.id);
            dispatch({ type: 'SET_ALL_POSTS_SELECTED', payload: allVisibleIds });
        } else {
            dispatch({ type: 'CLEAR_POST_SELECTION' });
        }
    };
    
    const renderWelcomeView = () => (
        <div className="workspace-welcome">
            <div className="icon">✍️</div>
            <h3>Content Hub</h3>
            <p>Ready to create? Start a new article, generate a batch, or build a complete topical cluster. You can also select an existing post from the list above to begin optimizing.</p>
        </div>
    );
    
    const renderNewPostView = () => (
         <div className="create-new-form">
            <h3>Create New Post</h3>
            <div className="post-ideas-generator">
                <h4>Need inspiration?</h4>
                <p className="help-text">Generate AI-powered blog post ideas based on your site's content to fill gaps and boost topical authority.</p>
                <button
                    onClick={onGeneratePostIdeas}
                    className="btn"
                    disabled={loading.ideas || fetchedUrls.length === 0}
                    style={{ width: 'auto', marginBottom: '1.5rem' }}
                >
                    {loading.ideas ? 'Generating Ideas...' : '✨ Generate 5 Post Ideas'}
                </button>
                 {fetchedUrls.length === 0 && (
                    <p className="help-text" style={{color: 'var(--warning-color)'}}>
                        Fetch your sitemap in Step 1 to enable this feature.
                    </p>
                )}
            </div>

            {postIdeas && postIdeas.length > 0 && (
                <div className="post-ideas-list">
                    {postIdeas.map((idea, index) => (
                        <div className="post-idea-card" key={index}>
                            <h5>{idea.title}</h5>
                            <p>{idea.rationale}</p>
                            <button
                                className="btn btn-small"
                                onClick={() => dispatch({ type: 'UPDATE_FIELD', payload: { field: 'rawContent', value: `Title: ${idea.title}\n\nRationale/Brief:\n${idea.rationale}` } })}
                            >
                                Use This Idea
                            </button>
                        </div>
                    ))}
                </div>
            )}
            <div className="form-group">
                <label htmlFor="rawContent">Raw Text Content for New Post</label>
                <textarea id="rawContent" value={rawContent} onChange={e => dispatch({type: 'UPDATE_FIELD', payload: {field: 'rawContent', value: e.target.value}})} placeholder="Paste your raw, unformatted text here, or generate ideas above and select one to start." required></textarea>
            </div>
             <div className="button-group">
                <button onClick={() => dispatch({type: 'SET_STEP', payload: 1})} className="btn btn-secondary">Back to Config</button>
                <button onClick={() => onGenerateContent()} className="btn" disabled={loading.content || !rawContent}>
                    {loading.content ? 'Generating...' : 'Optimize New Content'}
                </button>
            </div>
        </div>
    );

    const renderEditPostView = () => (
        <div className="create-new-form">
            <div className="edit-post-header">
                <h4>Editing: <span>{wpPosts.find(p => p.id === postToUpdate)?.title.rendered || '...'}</span></h4>
            </div>
            <div className="form-group">
                <label htmlFor="rawContent">Content from Selected Post</label>
                <textarea 
                    id="rawContent" 
                    value={rawContent} 
                    onChange={e => dispatch({type: 'UPDATE_FIELD', payload: {field: 'rawContent', value: e.target.value}})} 
                    placeholder={postToUpdate ? "Content is loaded from the selected post." : "Select a post from the list to load its content for optimization."}
                    disabled={!postToUpdate}
                    required
                ></textarea>
            </div>
             <div className="button-group">
                <button onClick={() => dispatch({type: 'SET_STEP', payload: 1})} className="btn btn-secondary">Back to Config</button>
                <button onClick={() => onGenerateContent()} className="btn" disabled={loading.content || !rawContent}>
                    {loading.content ? 'Generating...' : 'Optimize Existing Content'}
                </button>
            </div>
        </div>
    );

    const renderPostList = () => (
        <div className="post-list-section">
            <div className="post-list-header">
                <div className="post-list-header-main">
                    <h3>Update Existing Content</h3>
                    <p>Select a post from the list below to analyze, edit, and optimize it.</p>
                </div>
                <div className="post-list-actions">
                    <button onClick={handleCreateNewClick} className="btn">+ Create New</button>
                    {wpPosts.length > 0 && (
                        <button onClick={handleToggleMultiSelect} className={`btn btn-secondary ${isMultiSelectMode ? 'active' : ''}`}>
                             {isMultiSelectMode ? 'Cancel Selection' : 'Bulk Select'}
                        </button>
                    )}
                    <button onClick={handleCreateBatchClick} className="btn btn-secondary">🚀 Batch</button>
                    <button onClick={handleClusterClick} className="btn btn-secondary">🌐 Cluster</button>
                    <button onClick={handleDiscoverClick} className="btn btn-secondary">🔍 Discover</button>
                </div>
            </div>

            <div className="post-list-controls">
                {wpConnectionStatus !== 'success' ? (
                    <div className="warning-box" style={{margin: '0 0 1rem 0'}}>
                        <p>Verify WordPress connection in Step 1 to manage existing posts.</p>
                    </div>
                ) : wpPosts.length === 0 ? (
                    <button onClick={onFetchWpPosts} className="btn" disabled={loading.posts} style={{width: 'auto'}}>
                        {loading.posts ? 'Loading Posts...' : 'Load Published Posts'}
                    </button>
                ) : (
                    <div className="posts-filter-controls">
                        <input
                            type="text"
                            placeholder="Search posts..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="posts-search-input"
                        />
                        <div className="checkbox-group">
                            <input type="checkbox" id="hideUpdated" checked={hideUpdated} onChange={e => setHideUpdated(e.target.checked)} />
                            <label htmlFor="hideUpdated">Hide done posts</label>
                        </div>
                    </div>
                )}
            </div>

            <div className="posts-list-container">
                {/* Desktop Table View */}
                <table className="posts-table">
                    <thead>
                        <tr>
                            {isMultiSelectMode && (
                                <th className="checkbox-cell">
                                    <input 
                                        type="checkbox"
                                        onChange={handleSelectAll}
                                        checked={sortedAndFilteredPosts.length > 0 && selectedPosts.length === sortedAndFilteredPosts.length}
                                        title="Select All Visible"
                                    />
                                </th>
                            )}
                            <th onClick={() => requestSort('status')}>Status<span className="sort-indicator">{getSortIndicator('status')}</span></th>
                            <th onClick={() => requestSort('title')}>Post Title<span className="sort-indicator">{getSortIndicator('title')}</span></th>
                            <th onClick={() => requestSort('keyword')}>Keyword<span className="sort-indicator">{getSortIndicator('keyword')}</span></th>
                            <th onClick={() => requestSort('wordCount')}>Words<span className="sort-indicator">{getSortIndicator('wordCount')}</span></th>
                            <th onClick={() => requestSort('date')}>Published<span className="sort-indicator">{getSortIndicator('date')}</span></th>
                            <th onClick={() => requestSort('modified')}>Modified<span className="sort-indicator">{getSortIndicator('modified')}</span></th>
                            <th className="actions-cell">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedAndFilteredPosts.map(post => {
                            const status = getPostStatus(post);
                            const classNames = [
                                post.id === postToUpdate ? 'selected' : '',
                                selectedPosts.includes(post.id) ? 'multi-selected' : '',
                                !post.canEdit ? 'cannot-edit' : '',
                                post.updatedInSession ? 'updated-in-session' : ''
                            ].filter(Boolean).join(' ');

                            return (
                                <tr key={post.id} className={classNames} onClick={() => handlePostRowClick(post)}>
                                     {isMultiSelectMode && (
                                        <td className="checkbox-cell" onClick={e => e.stopPropagation()}>
                                            <input
                                                type="checkbox"
                                                checked={selectedPosts.includes(post.id)}
                                                onChange={() => handlePostSelection(post.id)}
                                            />
                                        </td>
                                    )}
                                    <td><span className={`status-pill ${status.className}`}>{status.text}</span></td>
                                    <td className="title-cell" title={post.title.rendered}>{post.title.rendered}</td>
                                    <td className="keyword-cell" title={post.keyword}>
                                        {post.status === 'loading' ? <div className="keyword-loading-spinner"></div> : (post.keyword || '–')}
                                    </td>
                                    <td>{post.wordCount ?? '–'}</td>
                                    <td>{new Date(post.date).toLocaleDateString()}</td>
                                    <td>{new Date(post.modified).toLocaleDateString()}</td>
                                    <td className="actions-cell">
                                        <a href={post.link} target="_blank" rel="noopener noreferrer" className="btn-icon" title="View Live Post" onClick={e => e.stopPropagation()}>
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                        </a>
                                        <button className="btn-icon" title="Analyze & Edit Post" disabled={!post.canEdit || post.status === 'loading' || isMultiSelectMode} onClick={e => {e.stopPropagation(); handlePostRowClick(post);}}>
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                 {/* Mobile Card View */}
                <div className="posts-card-view">
                    {sortedAndFilteredPosts.map(post => {
                        const status = getPostStatus(post);
                        const classNames = [
                            'post-card',
                            post.id === postToUpdate ? 'selected' : '',
                            selectedPosts.includes(post.id) ? 'multi-selected' : '',
                        ].filter(Boolean).join(' ');
                         return (
                            <div key={post.id} className={classNames} onClick={() => handlePostRowClick(post)}>
                                {isMultiSelectMode && (
                                    <input
                                        type="checkbox"
                                        className="post-card-checkbox"
                                        checked={selectedPosts.includes(post.id)}
                                        onChange={() => handlePostSelection(post.id)}
                                        onClick={e => e.stopPropagation()}
                                    />
                                )}
                                <div className="post-card-header">
                                    <h4 className="post-card-title">{post.title.rendered}</h4>
                                    <span className={`status-pill ${status.className}`}>{status.text}</span>
                                </div>
                                <div className="post-card-body">
                                    <div className="post-card-info">
                                        <span><strong>Keyword:</strong> {post.status === 'loading' ? '...' : (post.keyword || '–')}</span>
                                        <span><strong>Words:</strong> {post.wordCount ?? '–'}</span>
                                    </div>
                                    <div className="post-card-info">
                                         <span><strong>Modified:</strong> {new Date(post.modified).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                <div className="post-card-footer">
                                    <a href={post.link} target="_blank" rel="noopener noreferrer" className="btn-icon" title="View Live Post" onClick={e => e.stopPropagation()}>
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                    </a>
                                    <button className="btn-icon" title="Analyze & Edit Post" disabled={!post.canEdit || post.status === 'loading' || isMultiSelectMode} onClick={e => {e.stopPropagation(); handlePostRowClick(post);}}>
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
             {isMultiSelectMode && selectedPosts.length > 0 && (
                <div className="bulk-action-bar">
                    <span>{selectedPosts.length} post{selectedPosts.length !== 1 ? 's' : ''} selected</span>
                    <div className="bulk-action-buttons">
                        <button onClick={() => dispatch({type: 'CLEAR_POST_SELECTION'})} className="btn btn-secondary">Deselect All</button>
                        <button onClick={onBulkUpdate} className="btn">Optimize Selected Posts</button>
                    </div>
                </div>
            )}
        </div>
    );
    
    const renderClusterView = () => (
        <div className="create-new-form">
            <h3>Build a Topical Cluster</h3>
            <p className="help-text">Enter a core topic to build your website's authority. The AI will analyze your existing posts to create a strategic plan, suggesting new articles and identifying existing ones to update, avoiding keyword cannibalization.</p>
             {wpPosts.length === 0 && (
                <div className="warning-box" style={{margin: '0 0 1rem 0'}}>
                    <p><strong>Please load your published posts first.</strong> This allows the AI to create a cluster plan that integrates with your existing content and avoids duplication.</p>
                </div>
            )}
            <div className="form-group">
                <input
                    type="text"
                    id="clusterTopic"
                    value={clusterTopic}
                    onChange={e => dispatch({ type: 'SET_CLUSTER_TOPIC', payload: e.target.value })}
                    placeholder="e.g., Affiliate Marketing for Beginners"
                    disabled={loading.plan}
                />
            </div>
            <button onClick={onGenerateClusterPlan} className="btn" disabled={loading.plan || !clusterTopic.trim() || wpPosts.length === 0}>
                {loading.plan ? 'Planning...' : 'Generate Cluster Plan'}
            </button>
        </div>
    );
    
    const renderClusterPlanView = () => {
        if (!clusterPlan) return null;

        const newArticlesToGenerate = [clusterPlan.pillar, ...clusterPlan.clusters].filter(p => p.status === 'new').length;
        const allArticlesToProcess = [clusterPlan.pillar, ...clusterPlan.clusters].length;

        const handlePillarTitleChange = (e) => {
            dispatch({type: 'UPDATE_CLUSTER_PLAN', payload: { ...clusterPlan, pillar: { ...clusterPlan.pillar, title: e.target.value }}});
        };
        
        const handleClusterTitleChange = (index, newTitle) => {
            const newClusters = [...clusterPlan.clusters];
            newClusters[index] = { ...newClusters[index], title: newTitle };
            dispatch({ type: 'UPDATE_CLUSTER_PLAN', payload: { ...clusterPlan, clusters: newClusters }});
        };

        const handleRemoveCluster = (index) => {
            const newClusters = clusterPlan.clusters.filter((_, i) => i !== index);
            dispatch({ type: 'UPDATE_CLUSTER_PLAN', payload: { ...clusterPlan, clusters: newClusters } });
        };

        const handleAddCluster = () => {
             const newClusters = [...clusterPlan.clusters, { title: 'New Cluster Post Title', status: 'new' }];
             dispatch({ type: 'UPDATE_CLUSTER_PLAN', payload: { ...clusterPlan, clusters: newClusters } });
        };


        return (
            <div className="create-new-form">
                <h3>Review Your Topical Cluster Plan</h3>
                <p className="help-text">Review and edit the plan. "Update" items are existing posts to optimize. "New" items are content gaps to fill. The AI will generate all "New" articles and automatically interlink them.</p>

                <div className={`pillar-post-card status-${clusterPlan.pillar.status}`}>
                    <label>
                        Pillar Post 
                        <span className={`status-badge status-${clusterPlan.pillar.status}`}>{clusterPlan.pillar.status === 'existing' ? 'Update' : 'New'}</span>
                        {clusterPlan.pillar.url && (
                             <a href={clusterPlan.pillar.url} target="_blank" rel="noopener noreferrer" className="btn-icon post-link" title="View Live Post">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                             </a>
                        )}
                    </label>
                    <input type="text" value={clusterPlan.pillar.title} onChange={handlePillarTitleChange} disabled={clusterPlan.pillar.status === 'existing'} />
                </div>

                <div className="cluster-posts-list">
                    <label>Cluster Posts</label>
                    {clusterPlan.clusters.map((post, index) => (
                        <div key={index} className={`cluster-post-item status-${post.status}`}>
                            <input type="text" value={post.title} onChange={e => handleClusterTitleChange(index, e.target.value)} disabled={post.status === 'existing'} />
                            <span className={`status-badge status-${post.status}`}>{post.status === 'existing' ? 'Update' : 'New'}</span>
                             {post.url && (
                                <a href={post.url} target="_blank" rel="noopener noreferrer" className="btn-icon post-link" title="View Live Post">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                </a>
                            )}
                            {post.status === 'existing' && (
                                <button className="btn btn-small" style={{marginLeft: 'auto'}} onClick={() => onOptimizeClusterPost(post.title)} disabled={loading.content || loading.batch}>Optimize</button>
                            )}
                            <button className="btn-icon" title="Remove" onClick={() => handleRemoveCluster(index)}>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" /></svg>
                            </button>
                        </div>
                    ))}
                </div>

                <div className="plan-actions">
                    <button className="btn btn-secondary" style={{width: 'auto'}} onClick={handleAddCluster}>+ Add Idea</button>
                </div>
                
                <div className="button-group" style={{marginTop: '2rem'}}>
                    <button onClick={onGenerateClusterPlan} className="btn btn-secondary" disabled={loading.plan || loading.batch}>
                        {loading.plan ? 'Regenerating...' : 'Regenerate Plan'}
                    </button>
                    <button onClick={onGenerateClusterArticles} className="btn btn-secondary" disabled={loading.batch || newArticlesToGenerate === 0}>
                        {`Generate ${newArticlesToGenerate} New Articles`}
                    </button>
                     <button onClick={onProcessFullCluster} className="btn" disabled={loading.batch || allArticlesToProcess === 0}>
                        {loading.batch ? 'Processing Cluster...' : `Optimize & Generate Full Cluster (${allArticlesToProcess})`}
                    </button>
                </div>
            </div>
        );
    }
    
    const renderDiscoverClustersView = () => {
        const handleSelectTopic = (topic) => {
            dispatch({ type: 'SET_CLUSTER_TOPIC', payload: topic });
            setActiveView('cluster');
        };

        return (
            <div className="create-new-form">
                <h3>Discover Topical Cluster Opportunities</h3>
                <p className="help-text">Let AI analyze all your published posts to find the most promising topical cluster opportunities to build your site's authority.</p>
                {wpPosts.length === 0 && (
                    <div className="warning-box" style={{margin: '0 0 1rem 0'}}>
                        <p><strong>Please load your published posts first.</strong> Cluster discovery requires your existing content library for analysis.</p>
                    </div>
                )}
                <button onClick={onDiscoverClusters} className="btn" disabled={loading.discoverClusters || wpPosts.length === 0}>
                    {loading.discoverClusters ? 'Analyzing...' : 'Analyze & Suggest Top 4 Clusters'}
                </button>

                {suggestedClusters.length > 0 && (
                     <div className="post-ideas-list" style={{marginTop: '2rem'}}>
                        <h4>Suggested Cluster Topics</h4>
                        {suggestedClusters.map((cluster, index) => (
                            <div className="post-idea-card" key={index}>
                                <h5>{cluster.topic}</h5>
                                <p><strong>Rationale:</strong> {cluster.rationale}</p>
                                <details>
                                    <summary>View {cluster.supportingPosts.length} supporting articles</summary>
                                    <ul>
                                        {cluster.supportingPosts.map(p => <li key={p}>{p}</li>)}
                                    </ul>
                                </details>
                                <button
                                    className="btn btn-small"
                                    style={{marginTop: '1rem'}}
                                    onClick={() => handleSelectTopic(cluster.topic)}
                                >
                                    Build This Cluster
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    const batchViewProps = {
        jobs: batchJobs,
        topics: batchTopics,
        isLoading: loading.batch,
        onGenerate: onGenerateBatch,
        dispatch,
        onReviewItem: handleBatchItemReview,
    };

    return (
        <div className="step-container" id="step-2-content">
            <PageHeader title="Content Hub" description="Create new articles, optimize existing posts, or build entire topical clusters to dominate your niche."/>
            
            {renderPostList()}
            
            <div id="workspace-container" className="workspace-container">
                {activeView === 'welcome' && renderWelcomeView()}
                {activeView === 'new' && renderNewPostView()}
                {activeView === 'edit' && postToUpdate && renderEditPostView()}
                {activeView === 'batch' && <BatchGenerationView {...batchViewProps} />}
                {activeView === 'cluster' && renderClusterView()}
                {activeView === 'clusterPlan' && (loading.batch ? <BatchGenerationView {...batchViewProps} /> : renderClusterPlanView())}
                {activeView === 'discover' && renderDiscoverClustersView()}
            </div>
            
            <button className="fab" onClick={handleCreateNewClick} title="Create New Post">
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
            </button>
        </div>
    );
};

const ChipEditor = ({ items, setItems, label, placeholder }) => {
    const [inputValue, setInputValue] = useState('');

    const removeItem = (indexToRemove) => {
        setItems(items.filter((_, index) => index !== indexToRemove));
    };

    const addItem = (item) => {
        const newItem = item.trim();
        if (newItem && !items.includes(newItem)) {
            setItems([...items, newItem]);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            addItem(inputValue);
            setInputValue('');
        }
    };

    return (
        <div className="chip-editor">
            <label>{label}</label>
            <div className="chip-container">
                {items.map((item, index) => (
                    <span key={item} className="chip">
                        {item}
                        <button onClick={() => removeItem(index)}>&times;</button>
                    </span>
                ))}
                <input
                    type="text"
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                />
            </div>
            <p className="help-text">Press Enter or comma to add a new item.</p>
        </div>
    );
}

const FeaturedImageGenerator = ({ title, featuredImage, setFeaturedImage, isGenerating, onRegenerate }) => {
    return (
        <div className="featured-image-generator">
            <label>AI Featured Image</label>
            <div className="image-prompt-group">
                <input type="text" value={featuredImage.prompt} onChange={e => setFeaturedImage({ ...featuredImage, prompt: e.target.value })} placeholder="Enter a prompt for the image..." />
                <button onClick={() => onRegenerate('featured', null, featuredImage.prompt)} className="btn" disabled={isGenerating || !featuredImage.prompt}>
                    {isGenerating ? '...' : 'Generate'}
                </button>
            </div>
            <div className="image-preview-container">
                {isGenerating && <div className="spinner"></div>}
                {!isGenerating && featuredImage.base64 && (
                    <img src={`data:image/jpeg;base64,${featuredImage.base64}`} alt={featuredImage.prompt} />
                )}
            </div>
        </div>
    );
};

const CopyButton = ({ textToCopy, className = '' }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = (e) => {
        e.preventDefault();
        if (!textToCopy) return;
        navigator.clipboard.writeText(textToCopy).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }).catch(err => {
            console.error('Could not copy text: ', err);
        });
    };

    return (
        <button onClick={handleCopy} className={`btn-copy ${copied ? 'success' : ''} ${className}`} title="Copy to clipboard" aria-label="Copy to clipboard" disabled={!textToCopy}>
            {copied ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M12.736 3.97a.733.733 0 0 1 1.047 0c.286.289.29.756.01 1.05L7.88 12.01a.733.733 0 0 1-1.065.02L3.217 8.384a.757.757 0 0 1 0-1.06.733.733 0 0 1 1.047 0l3.052 3.093 5.4-6.425a.247.247 0 0 1 .02-.022z"/>
                </svg>
            ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M13 0H6a2 2 0 0 0-2 2 2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h7a2 2 0 0 0 2-2 2 2 0 0 0 2-2V2a2 2 0 0 0-2-2zM5 10.5A1.5 1.5 0 0 1 3.5 12h-1A1.5 1.5 0 0 1 1 10.5v-7A1.5 1.5 0 0 1 2.5 2h1A1.5 1.5 0 0 1 5 3.5v7zm8-1.5A1.5 1.5 0 0 1 11.5 12h-5A1.5 1.5 0 0 1 5 10.5v-7A1.5 1.5 0 0 1 6.5 2h5A1.5 1.5 0 0 1 13 3.5v5.5z"/>
                </svg>
            )}
        </button>
    );
};

const ReviewPublishStep = ({ state, dispatch, onPostAction, onImageRegen }) => {
    const { finalTitle, slug, metaDescription, finalContent, tags, categories, featuredImage, loading, infographics, duplicateInfo, publishMode, result } = state;
    const [activeTab, setActiveTab] = useState('editor');

    const setField = (field, value) => dispatch({type: 'UPDATE_FINAL_POST', payload: { [field]: value }});
    const setTags = (newTags) => setField('tags', newTags);
    const setCategories = (newCategories) => setField('categories', newCategories);
    
    const setFeaturedImage = (newImage) => {
        setField('featuredImage', newImage);
    }
    
    const setInfographic = (id, newInfographic) => {
        const newInfographics = infographics.map(info => info.id === id ? newInfographic : info);
        setField('infographics', newInfographics);
    };

    const renderedContent = useMemo(() => {
        let content = finalContent;
        if(infographics && infographics.length > 0) {
            infographics.forEach((info) => {
                const placeholderRegex = new RegExp(`<!-- INFOGRAPHIC-PLACEHOLDER-${info.id} -->`, 'g');
                if (info.base64) {
                    const imageTag = `<div class="infographic-placeholder"><img src="data:image/jpeg;base64,${info.base64}" alt="${info.title}" /></div>`;
                    content = content.replace(placeholderRegex, imageTag);
                }
            });
        }
        return content;
    }, [finalContent, infographics]);

    const hasPublished = result && result.type === 'success';

    return (
        <div id="step-3-review">
             <PageHeader title="Review & Publish" description="Fine-tune the generated content, metadata, and images before publishing directly to your WordPress site."/>

            {duplicateInfo.similarUrl && publishMode === 'update' && !hasPublished && (
                 <div className="warning-box">
                    <h4>⚠️ Updating Existing Post</h4>
                    <p>You are about to update an existing article. The new content below will replace the current version on your website.</p>
                    <p><strong>Existing Article:</strong> <a href={duplicateInfo.similarUrl} target="_blank" rel="noopener noreferrer">{duplicateInfo.similarUrl}</a></p>
                </div>
            )}
            
            <div className="review-layout-grid">
                <div className="review-main">
                    <div className="review-tabs">
                        <button 
                            className={`tab-btn ${activeTab === 'editor' ? 'active' : ''}`}
                            onClick={() => setActiveTab('editor')}>
                            HTML Editor
                        </button>
                        <button 
                            className={`tab-btn ${activeTab === 'preview' ? 'active' : ''}`}
                            onClick={() => setActiveTab('preview')}>
                            Live Preview
                        </button>
                    </div>

                     <div className="review-content">
                        {activeTab === 'editor' && (
                            <div className="review-panel-content">
                                 <div className="form-group">
                                    <div className="label-wrapper">
                                        <label htmlFor="finalContent">Generated HTML Content</label>
                                        <CopyButton textToCopy={finalContent} />
                                    </div>
                                    <textarea id="finalContent" value={finalContent} onChange={e => setField('finalContent', e.target.value)} style={{minHeight: '300px', fontFamily: 'monospace'}}></textarea>
                                </div>
                            </div>
                        )}
                         {activeTab === 'preview' && (
                            <div className="review-panel-content live-preview" dangerouslySetInnerHTML={{ __html: renderedContent }} />
                        )}
                    </div>
                </div>

                <aside className="review-side-panel">
                    <div className="side-panel-card">
                        <h4>SEO & Metadata</h4>
                        <div className="form-group">
                            <label htmlFor="finalTitle">Generated Title</label>
                            <input type="text" id="finalTitle" value={finalTitle} onChange={e => setField('finalTitle', e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label htmlFor="finalSlug">SEO Slug</label>
                            <input type="text" id="finalSlug" value={slug} onChange={e => setField('slug', e.target.value)} />
                        </div>
                         <div className="form-group">
                            <label htmlFor="metaDescription">Meta Description (for SEO)</label>
                            <textarea id="metaDescription" value={metaDescription} onChange={e => setField('metaDescription', e.target.value)} maxLength={160}></textarea>
                             <p className={`char-counter ${metaDescription.length > 150 ? 'limit-exceeded' : ''}`}>
                                {metaDescription.length} / 150
                            </p>
                        </div>
                        <ChipEditor items={tags} setItems={setTags} label="Tags" placeholder="Add a tag..." />
                        <ChipEditor items={categories} setItems={setCategories} label="Categories" placeholder="Add a category..." />
                    </div>

                    <div className="side-panel-card">
                        <h4>Media Assets</h4>
                        <FeaturedImageGenerator 
                            title={finalTitle} 
                            featuredImage={featuredImage} 
                            setFeaturedImage={setFeaturedImage} 
                            isGenerating={loading.featuredImage}
                            onRegenerate={onImageRegen}
                        />
                        
                        {infographics && infographics.length > 0 && (
                            <div className="infographic-blueprints">
                                <h4>Infographics</h4>
                                {infographics.map((info) => {
                                    const dataAsString = typeof info.data === 'object' && info.data !== null 
                                        ? JSON.stringify(info.data, null, 2) 
                                        : String(info.data || '');

                                    return (
                                        <div key={info.id} className="infographic-card">
                                            <div className="image-preview-container">
                                                {loading[`infographic-${info.id}`] && <div className="spinner"></div>}
                                                {!loading[`infographic-${info.id}`] && info.base64 && <img src={`data:image/jpeg;base64,${info.base64}`} alt={info.title} />}
                                            </div>
                                            <details>
                                                <summary>{`${info.title}`}</summary>
                                                 <div className="image-prompt-group" style={{marginTop: '1rem'}}>
                                                    <input type="text" value={info.imagePrompt} onChange={e => setInfographic(info.id, {...info, imagePrompt: e.target.value})} />
                                                    <button onClick={() => onImageRegen('infographic', info.id, info.imagePrompt)} className="btn" disabled={loading[`infographic-${info.id}`]}>
                                                        {loading[`infographic-${info.id}`] ? '...' : 'Regen'}
                                                    </button>
                                                </div>
                                                <div className="infographic-card-data-wrapper">
                                                    <pre className="infographic-card-data">{dataAsString}</pre>
                                                    <CopyButton textToCopy={dataAsString} />
                                                </div>
                                            </details>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </aside>
            </div>
            
            <div className="button-group">
                {hasPublished ? (
                    <>
                        <h3>What's next?</h3>
                        <button onClick={() => dispatch({type: 'RESET_FOR_NEW_POST'})} className="btn">
                            Create/Update Another Post
                        </button>
                        <button onClick={() => dispatch({type: 'SET_STEP', payload: 1})} className="btn btn-secondary">
                            Start Over (New Config)
                        </button>
                    </>
                ) : (
                    <>
                        <button onClick={() => dispatch({type: 'SET_STEP', payload: 2})} className="btn btn-secondary">Back to Content</button>
                        <button onClick={() => onPostAction(publishMode)} className="btn" disabled={loading.publish}>
                            {loading.publish 
                                ? (publishMode === 'update' ? 'Updating...' : 'Publishing...')
                                : (publishMode === 'update' ? 'Update Existing Post' : 'Publish to WordPress')
                            }
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

const initialState = {
    step: 1,
    loading: { sitemap: false, content: false, publish: false, featuredImage: false, posts: false, ideas: false, wpConnection: false, batch: false, plan: false, discoverClusters: false },
    logs: [],
    result: null,
    wpUrl: '',
    wpUser: '',
    wpPassword: '',
    sitemapUrl: 'https://affiliatemarketingforsuccess.com/sitemap.xml',
    urlLimit: 500,
    fetchedUrls: [],
    rawContent: '',
    finalTitle: '',
    slug: '',
    metaDescription: '',
    finalContent: '',
    tags: [],
    categories: [],
    featuredImage: { prompt: '', base64: '' },
    infographics: [], // { id, title, type, data, imagePrompt, base64 }
    aiProvider: 'gemini',
    apiKeys: { gemini: '', openai: '', claude: '', openrouter: '' },
    keyStatus: { gemini: 'idle', openai: 'idle', claude: 'idle', openrouter: 'idle' },
    openRouterModel: 'google/gemini-2.5-flash',
    duplicateInfo: { similarUrl: null, postId: null },
    publishMode: 'publish', // 'publish' or 'update'
    wpPosts: [], // { id, title, link, date, modified, keyword, content, status, updatedInSession, canEdit, wordCount }
    postToUpdate: null, // number | null
    postIdeas: [],
    batchTopics: '',
    batchJobs: [], // { id, title, status, result }
    wpConnectionStatus: 'idle', // idle, verifying, success, error
    wpConnectionError: '',
    wpUserRoles: [],
    wpCategories: [],
    clusterTopic: '',
    clusterPlan: null, // { pillar: { title, status, url? }, clusters: [{ title, status, url? }] }
    suggestedClusters: [], // { topic: string, rationale: string, supportingPosts: string[] }
    isMultiSelectMode: false,
    selectedPosts: [],
};


function appReducer(state, action) {
    switch (action.type) {
        case 'SET_STEP':
            return { ...state, step: action.payload, result: null };
        case 'SET_LOADING_STATE':
            return { ...state, loading: { ...state.loading, ...action.payload } };
        case 'ADD_LOG':
            return { ...state, logs: [action.payload, ...state.logs] };
        case 'CLEAR_LOGS':
             return { ...state, logs: [], result: null };
        case 'SET_RESULT':
            return { ...state, result: action.payload };
        case 'SET_CONFIG':
            return { ...state, ...action.payload };
        case 'RESET_CONFIG':
            return {
                ...state,
                wpUrl: '', wpUser: '', wpPassword: '', sitemapUrl: 'https://affiliatemarketingforsuccess.com/sitemap.xml', urlLimit: 500,
                aiProvider: 'gemini', apiKeys: { gemini: '', openai: '', claude: '', openrouter: '' },
                keyStatus: { gemini: 'idle', openai: 'idle', claude: 'idle', openrouter: 'idle' },
                wpConnectionStatus: 'idle', wpConnectionError: '', wpUserRoles: [], wpCategories: [],
            };
        case 'UPDATE_FIELD':
            const newState = { ...state, [action.payload.field]: action.payload.value };
            if (['wpUrl', 'wpUser', 'wpPassword'].includes(action.payload.field)) {
                newState.wpConnectionStatus = 'idle';
                newState.wpConnectionError = '';
                newState.wpUserRoles = [];
                newState.wpCategories = [];
            }
            return newState;
        case 'SET_FETCHED_URLS':
            return { ...state, fetchedUrls: action.payload, step: 2 };
        case 'SET_GENERATED_CONTENT':
            return { 
                ...state,
                ...action.payload,
                step: 3,
                ...(!state.postToUpdate && {
                    duplicateInfo: { similarUrl: null, postId: null },
                    publishMode: 'publish',
                }),
            };
        case 'UPDATE_FINAL_POST':
            return { ...state, ...action.payload };
        case 'SET_AI_PROVIDER':
            return { ...state, aiProvider: action.payload };
        case 'UPDATE_API_KEY':
            return { ...state, apiKeys: { ...state.apiKeys, [action.payload.provider]: action.payload.key } };
        case 'SET_KEY_STATUS':
            return { ...state, keyStatus: { ...state.keyStatus, [action.payload.provider]: action.payload.status } };
        case 'SET_DUPLICATE_INFO':
            return { ...state, duplicateInfo: action.payload };
        case 'SET_PUBLISH_MODE':
            return { ...state, publishMode: action.payload };
        case 'SET_WP_POSTS':
            const roles = state.wpUserRoles || [];
            const isAdminOrEditor = roles.includes('administrator') || roles.includes('editor');
            const postsWithEditability = action.payload.map(p => ({
                ...p,
                wordCount: null, // Initialize wordCount
                // If the user is an admin/editor, they can edit everything.
                // Otherwise, fall back to checking the API's permission link.
                canEdit: isAdminOrEditor || !!(p._links && p._links['wp:action-edit'])
            }));
            return { ...state, wpPosts: postsWithEditability };
        case 'UPDATE_WP_POST_STATUS':
            return {
                ...state,
                wpPosts: state.wpPosts.map(p => p.id === action.payload.id ? { ...p, status: action.payload.status } : p),
            };
        case 'SET_WP_POST_DATA':
            return {
                ...state,
                wpPosts: state.wpPosts.map(p => p.id === action.payload.id ? { ...p, keyword: action.payload.keyword, wordCount: action.payload.wordCount, status: 'done' } : p),
                rawContent: action.payload.content,
                postToUpdate: action.payload.id,
            };
        case 'TOGGLE_POST_UPDATED_STATUS':
            return {
                ...state,
                wpPosts: state.wpPosts.map(p => 
                    p.id === action.payload.id ? { ...p, updatedInSession: !p.updatedInSession } : p
                ),
            };
        case 'MARK_POST_AS_UPDATED':
             return {
                ...state,
                wpPosts: state.wpPosts.map(p => 
                    p.id === action.payload.id ? { ...p, updatedInSession: true } : p
                ),
            };
        case 'CLEAR_UPDATE_SELECTION':
            return { ...state, postToUpdate: null, rawContent: '' };
        case 'SET_POST_IDEAS':
            return { ...state, postIdeas: action.payload };
        case 'SET_BATCH_TOPICS':
            return { ...state, batchTopics: action.payload };
        case 'SET_WP_CONNECTION_STATUS':
            const isSuccess = action.payload.status === 'success';
            return { 
                ...state, 
                wpConnectionStatus: action.payload.status,
                wpConnectionError: action.payload.error || '',
                wpUserRoles: action.payload.roles || (isSuccess ? state.wpUserRoles : []),
                wpCategories: isSuccess ? state.wpCategories : [],
            };
        case 'SET_WP_CATEGORIES':
            return { ...state, wpCategories: action.payload };
        case 'START_BATCH_GENERATION':
            return { ...state, loading: { ...state.loading, batch: true }, batchJobs: action.payload, logs: [], result: null };
        case 'UPDATE_BATCH_JOB_STATUS':
            return {
                ...state,
                batchJobs: state.batchJobs.map(job =>
                    job.id === action.payload.id ? { ...job, status: action.payload.status, result: action.payload.result } : job
                )
            };
        case 'FINISH_BATCH_GENERATION':
            return { ...state, loading: { ...state.loading, batch: false } };
        case 'LOAD_BATCH_RESULT_FOR_REVIEW':
            return {
                ...state,
                step: 3,
                result: null,
                logs: [],
                ...action.payload.content,
                publishMode: action.payload.postId ? 'update' : 'publish',
                postToUpdate: action.payload.postId || null,
                duplicateInfo: {
                    similarUrl: action.payload.postLink || null,
                    postId: action.payload.postId || null,
                },
            };
        case 'SET_CLUSTER_TOPIC':
            return { ...state, clusterTopic: action.payload };
        case 'START_PLAN_GENERATION':
            return { ...state, loading: { ...state.loading, plan: true } };
        case 'FINISH_PLAN_GENERATION':
            return { ...state, loading: { ...state.loading, plan: false } };
        case 'SET_CLUSTER_PLAN':
            return { ...state, clusterPlan: action.payload };
        case 'UPDATE_CLUSTER_PLAN':
            return { ...state, clusterPlan: action.payload };
        case 'CLEAR_CLUSTER_PLAN':
            return { ...state, clusterTopic: '', clusterPlan: null, batchJobs: [] };
        case 'START_DISCOVER_CLUSTERS':
            return { ...state, loading: { ...state.loading, discoverClusters: true } };
        case 'FINISH_DISCOVER_CLUSTERS':
            return { ...state, loading: { ...state.loading, discoverClusters: false } };
        case 'SET_SUGGESTED_CLUSTERS':
            return { ...state, suggestedClusters: action.payload };
        case 'TOGGLE_MULTI_SELECT_MODE':
            return { ...state, isMultiSelectMode: !state.isMultiSelectMode, selectedPosts: [] };
        case 'TOGGLE_POST_SELECTION':
            const isSelected = state.selectedPosts.includes(action.payload);
            const newSelectedPosts = isSelected
                ? state.selectedPosts.filter(id => id !== action.payload)
                : [...state.selectedPosts, action.payload];
            return { ...state, selectedPosts: newSelectedPosts };
        case 'SET_ALL_POSTS_SELECTED':
            return { ...state, selectedPosts: action.payload };
        case 'CLEAR_POST_SELECTION':
            return { ...state, selectedPosts: [] };
        case 'RESET_FOR_NEW_POST':
            return {
                ...state,
                step: 2,
                loading: { ...initialState.loading, posts: state.loading.posts },
                logs: [],
                result: null,
                rawContent: '',
                finalTitle: '',
                slug: '',
                metaDescription: '',
                finalContent: '',
                tags: [],
                categories: [],
                featuredImage: { prompt: '', base64: '' },
                infographics: [],
                duplicateInfo: { similarUrl: null, postId: null },
                publishMode: 'publish',
                postToUpdate: null,
                postIdeas: [],
                clusterTopic: '',
                clusterPlan: null,
                batchJobs: [],
            };
        default:
            throw new Error(`Unhandled action type: ${action.type}`);
    }
}


// Main App Component
const App = () => {
    const [state, dispatch] = useReducer(appReducer, initialState);
    const {
        sitemapUrl, urlLimit, aiProvider, apiKeys, openRouterModel, rawContent,
        fetchedUrls, wpUrl, wpUser, wpPassword, finalTitle, slug, finalContent,
        tags, categories, featuredImage, infographics, metaDescription, clusterPlan, clusterTopic,
        batchTopics
    } = state;

    const addLog = useCallback((message) => dispatch({type: 'ADD_LOG', payload: message}), []);

    const handleKeyValidation = useCallback(async (provider, key) => {
        try {
            if (provider === 'gemini') {
                const ai = new GoogleGenAI({ apiKey: key });
                await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: 'test' , config: { maxOutputTokens: 2, thinkingConfig: { thinkingBudget: 0 } }});
            } else if (provider === 'openai') {
                const openai = new OpenAI({ apiKey: key, dangerouslyAllowBrowser: true });
                await openai.models.list();
            } else if (provider === 'claude') {
                const anthropic = new Anthropic({ apiKey: key });
                await anthropic.messages.create({model: "claude-3-haiku-20240307", max_tokens: 1, messages: [{role: "user", content: "test"}]});
            } else if (provider === 'openrouter') {
                const response = await fetch("https://openrouter.ai/api/v1/models", { headers: { 'Authorization': `Bearer ${key}` } });
                if (!response.ok) throw new Error("Invalid OpenRouter Key");
            }
            dispatch({ type: 'SET_KEY_STATUS', payload: { provider, status: 'valid' } });
        } catch (error) {
            dispatch({ type: 'SET_KEY_STATUS', payload: { provider, status: 'invalid' } });
        }
    }, []);

    const handleVerifyWpConnection = useCallback(async () => {
        dispatch({ type: 'SET_LOADING_STATE', payload: { wpConnection: true } });
        dispatch({ type: 'SET_WP_CONNECTION_STATUS', payload: { status: 'verifying' } });
        addLog(`🔐 Verifying connection to ${wpUrl}...`);

        try {
            const apiUrl = `${wpUrl.replace(/\/$/, '')}/wp-json/wp/v2/users/me?context=edit`;
            const credentials = btoa(`${wpUser}:${wpPassword}`);
            const headers = { 'Authorization': `Basic ${credentials}` };

            const response = await fetch(apiUrl, { headers });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || `Request failed with status ${response.status}`);
            }
            
            addLog(`✅ Connection successful. Logged in as ${data.name}. Fetching categories...`);
            dispatch({ type: 'SET_WP_CONNECTION_STATUS', payload: { status: 'success', roles: data.roles } });

            // Fetch categories
            const categoriesUrl = `${wpUrl.replace(/\/$/, '')}/wp-json/wp/v2/categories?per_page=100&_fields=id,name`;
            const categoriesResponse = await fetch(categoriesUrl, { headers });
            if (!categoriesResponse.ok) {
                addLog('⚠️ Could not fetch WordPress categories, but connection is otherwise valid. AI will generate categories.');
                dispatch({ type: 'SET_WP_CATEGORIES', payload: [] });
            } else {
                const categoriesData = await categoriesResponse.json();
                dispatch({ type: 'SET_WP_CATEGORIES', payload: categoriesData });
                addLog(`✅ Found ${categoriesData.length} categories.`);
            }

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            addLog(`❌ Connection failed: ${errorMessage}`);
            dispatch({ type: 'SET_WP_CONNECTION_STATUS', payload: { status: 'error', error: errorMessage } });
        } finally {
            dispatch({ type: 'SET_LOADING_STATE', payload: { wpConnection: false } });
        }
    }, [wpUrl, wpUser, wpPassword, addLog]);


    const handleFetchSitemap = useCallback(async (fetchUrls = true) => {
        dispatch({ type: 'CLEAR_LOGS' });
        dispatch({ type: 'SET_LOADING_STATE', payload: { sitemap: true } });

        if (!fetchUrls) {
            dispatch({ type: 'SET_FETCHED_URLS', payload: [] });
            addLog('⏩ Skipped sitemap fetch. Proceeding to content generation.');
            dispatch({ type: 'SET_LOADING_STATE', payload: { sitemap: false } });
            return;
        }

        addLog(`📡 Initializing sitemap fetch from ${sitemapUrl}`);
        try {
            const allUrls = new Set();
            const queue = [sitemapUrl];
            const processedSitemaps = new Set();
            const CORS_PROXY = 'https://corsproxy.io/?';

            while (queue.length > 0 && allUrls.size < urlLimit) {
                const currentSitemapUrl = queue.shift();
                if (!currentSitemapUrl || processedSitemaps.has(currentSitemapUrl)) continue;

                addLog(`📄 Fetching ${currentSitemapUrl}...`);
                const proxiedUrl = `${CORS_PROXY}${encodeURIComponent(currentSitemapUrl)}`;
                
                const response = await fetch(proxiedUrl);
                if (!response.ok) {
                    throw new Error(`Failed to fetch sitemap from ${currentSitemapUrl}. Status: ${response.status} ${response.statusText}`);
                }
                
                const xmlText = await response.text();
                processedSitemaps.add(currentSitemapUrl);

                const parser = new DOMParser();
                const doc = parser.parseFromString(xmlText, "application/xml");
                const parserError = doc.querySelector('parsererror');
                if (parserError) {
                     throw new Error(`Failed to parse XML from ${currentSitemapUrl}. Error: ${parserError.textContent}`);
                }

                if (doc.documentElement.tagName.toLowerCase() === 'sitemapindex') {
                    addLog('🗂️ Sitemap index detected. Parsing sub-sitemaps.');
                    const subSitemaps = Array.from(doc.getElementsByTagName('loc')).map(loc => loc.textContent).filter(Boolean);
                    addLog(`Found ${subSitemaps.length} sub-sitemaps.`);
                    queue.push(...subSitemaps);
                } else {
                    Array.from(doc.getElementsByTagName('loc')).forEach(loc => {
                        if (allUrls.size < urlLimit && loc.textContent) allUrls.add(loc.textContent);
                    });
                    addLog(`Found ${doc.getElementsByTagName('loc').length} URLs. Total unique: ${allUrls.size}`);
                }
            }

            if (allUrls.size === 0) throw new Error('No URLs found. Check sitemap URL and its content.');
            
            const finalUrls = Array.from(allUrls);
            dispatch({ type: 'SET_FETCHED_URLS', payload: finalUrls });
            addLog(`✅ Finished. ${finalUrls.length} URLs collected.`);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            addLog(`❌ Error: ${errorMessage}`);
            dispatch({ type: 'SET_RESULT', payload: { type: 'error', message: errorMessage } });
        } finally {
            dispatch({ type: 'SET_LOADING_STATE', payload: { sitemap: false } });
        }
    }, [sitemapUrl, urlLimit, addLog]);

    const handleFetchWpPosts = useCallback(async () => {
        dispatch({ type: 'CLEAR_LOGS' });
        dispatch({ type: 'SET_LOADING_STATE', payload: { posts: true } });
        addLog(`📡 Fetching posts from ${wpUrl}...`);

        try {
            const apiUrl = `${wpUrl.replace(/\/$/, '')}/wp-json/wp/v2/posts?status=publish&per_page=100&_fields=id,title,link,date,modified,_links`;
            const credentials = btoa(`${wpUser}:${wpPassword}`);
            const headers = { 'Authorization': `Basic ${credentials}` };

            const response = await fetch(apiUrl, { headers });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`WP Error: ${errorData.message || response.statusText}`);
            }

            const posts = await response.json();
            posts.sort((a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime());
            const postsWithStatus = posts.map(p => ({ ...p, status: 'idle', keyword: '', updatedInSession: false }));
            dispatch({ type: 'SET_WP_POSTS', payload: postsWithStatus });
            addLog(`✅ Found ${posts.length} published posts. Sorted by most recently modified first.`);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            addLog(`❌ Error fetching posts: ${errorMessage}`);
            dispatch({ type: 'SET_RESULT', payload: { type: 'error', message: errorMessage } });
        } finally {
            dispatch({ type: 'SET_LOADING_STATE', payload: { posts: false } });
        }
    }, [wpUrl, wpUser, wpPassword, addLog]);
    
    const handleAnalyzeAndSelect = useCallback(async (post) => {
        dispatch({ type: 'UPDATE_WP_POST_STATUS', payload: { id: post.id, status: 'loading' } });
        addLog(`🔍 Analyzing post: "${post.title.rendered}"`);

        try {
            // 1. Fetch post content
            const apiUrl = `${wpUrl.replace(/\/$/, '')}/wp-json/wp/v2/posts/${post.id}?_fields=content`;
            const credentials = btoa(`${wpUser}:${wpPassword}`);
            const headers = { 'Authorization': `Basic ${credentials}` };
            const response = await fetch(apiUrl, { headers });
            if (!response.ok) throw new Error('Failed to fetch post content.');
            const postData = await response.json();
            const contentHtml = postData.content.rendered;

            // Strip HTML for cleaner analysis
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = contentHtml;
            const textContent = tempDiv.textContent || tempDiv.innerText || "";
            const wordCount = textContent ? textContent.trim().split(/\s+/).length : 0;
            
            // 2. Get keyword from AI
            addLog(`🤖 Asking AI for main keyword...`);
            const prompt = `Based on the following blog post title and a snippet of its content, what is the single most important main keyword or keyphrase? Respond with ONLY the keyword/keyphrase.\n\nTitle: ${post.title.rendered}\n\nContent Snippet: ${textContent.substring(0, 800)}`;
            
            const apiKey = apiKeys[aiProvider];
            if (!apiKey) throw new Error(`${aiProvider} API Key is not set.`);
            
            let keyword = '';

            if (aiProvider === 'gemini') {
                const ai = new GoogleGenAI({ apiKey });
                const aiResponse = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { thinkingConfig: { thinkingBudget: 0 } } });
                keyword = aiResponse.text.trim();
            } else if (aiProvider === 'openai' || aiProvider === 'openrouter') {
                const clientOptions: any = { apiKey, dangerouslyAllowBrowser: true };
                if (aiProvider === 'openrouter') {
                    clientOptions.baseURL = "https://openrouter.ai/api/v1";
                }
                const openai = new OpenAI(clientOptions);
                const model = aiProvider === 'openai' ? 'gpt-4o' : openRouterModel;
                if (!model) throw new Error("OpenRouter model is not specified.");
                const aiResponse = await openai.chat.completions.create({ model, messages: [{ role: "user", content: prompt }], max_tokens: 20 });
                keyword = aiResponse.choices[0].message.content.trim();
            } else if (aiProvider === 'claude') {
                const anthropic = new Anthropic({ apiKey });
                const aiResponse = await anthropic.messages.create({
                    model: "claude-3-haiku-20240307",
                    max_tokens: 20,
                    messages: [{ role: "user", content: prompt }]
                });
                const block = aiResponse.content.find(b => b.type === 'text');
                if (block && block.type === 'text') {
                    keyword = block.text.trim();
                } else {
                    throw new Error("Claude did not return a valid text response.");
                }
            }

            if (!keyword) {
                throw new Error("AI failed to identify a keyword.");
            }

            addLog(`✅ Keyword identified: "${keyword}". Loading content into editor.`);
            dispatch({
                type: 'SET_WP_POST_DATA',
                payload: { id: post.id, link: post.link, keyword, content: contentHtml, wordCount }
            });

        } catch (error) {
             const errorMessage = error instanceof Error ? error.message : String(error);
            addLog(`❌ Error during analysis: ${errorMessage}`);
            dispatch({ type: 'UPDATE_WP_POST_STATUS', payload: { id: post.id, status: 'idle' } });
        }
    }, [wpUrl, wpUser, wpPassword, aiProvider, apiKeys, openRouterModel, addLog]);
    
    const cleanAiResponse = (text) => {
        if (!text) return '';
        const match = text.match(/```json\n([\s\S]*?)\n```/);
        return match ? match[1].trim() : text.trim();
    };

    const handleGeneratePostIdeas = useCallback(async () => {
        if (fetchedUrls.length === 0) {
            addLog('⚠️ Cannot generate ideas without a sitemap. Please fetch a sitemap in Step 1.');
            return;
        }
        dispatch({ type: 'SET_LOADING_STATE', payload: { ideas: true } });
        addLog('🤖 Generating post ideas to boost topical authority...');

        try {
            const apiKey = apiKeys[aiProvider];
            if (!apiKey) throw new Error(`${aiProvider.charAt(0).toUpperCase() + aiProvider.slice(1)} API Key is required for this feature.`);

            const prompt = `You are a world-class SEO strategist and content planner with deep expertise in establishing topical authority for websites.

Your task is to analyze the following list of URLs, which represent the content library of a target website. Based on this analysis, generate 5 high-quality blog post ideas that will strategically fill content gaps and bridge existing topics to significantly boost the site's topical authority and organic rankings.

### INSTRUCTIONS:
1.  **Analyze the Sitemap**: Carefully review the provided URLs to understand the core topics, themes, and entities the website covers.
2.  **Identify "Missing Links"**: Find thematic gaps or opportunities for articles that would act as a "missing link," connecting disparate topics on the site and creating a more cohesive content cluster.
3.  **Craft Compelling Titles**: For each idea, create a compelling, SEO-friendly title that is highly likely to attract clicks.
4.  **Write a Strategic Rationale**: For each title, write a brief (2-3 sentences) rationale explaining *why* this post is crucial for the website's topical authority. Explain which existing topics it connects and what new semantic territory it covers.
5.  **Output in JSON**: The final output MUST be a single, raw JSON object with no markdown formatting. ${
                aiProvider === 'gemini' 
                ? 'It should be an array of 5 objects, each with the keys "title" and "rationale".' 
                : 'The root of the object must be a key named "ideas" which contains an array of 5 objects, where each object has the keys "title" and "rationale".'
            }

### WEBSITE URLs FOR ANALYSIS:
---
${fetchedUrls.join('\n')}
---
`;
            
            let responseText = '';

            if (aiProvider === 'gemini') {
                const ai = new GoogleGenAI({ apiKey });
                const responseSchema = {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            title: {
                                type: Type.STRING,
                                description: "The compelling, SEO-friendly title for the blog post idea."
                            },
                            rationale: {
                                type: Type.STRING,
                                description: "A brief explanation of why this post is strategically important for topical authority."
                            }
                        },
                        required: ['title', 'rationale']
                    }
                };

                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: prompt,
                    config: {
                        responseMimeType: "application/json",
                        responseSchema: responseSchema,
                    }
                });
                responseText = response.text;
            } else if (aiProvider === 'openai' || aiProvider === 'openrouter') {
                 const clientOptions: any = { apiKey, dangerouslyAllowBrowser: true };
                 if (aiProvider === 'openrouter') {
                     clientOptions.baseURL = "https://openrouter.ai/api/v1";
                 }
                 const openai = new OpenAI(clientOptions);
                 const model = aiProvider === 'openai' ? 'gpt-4o' : openRouterModel;
                 if (!model) throw new Error("OpenRouter model is not specified.");
                 addLog(`Using model: ${model}`);
                 const response = await openai.chat.completions.create({ model, messages: [{ role: "user", content: prompt }], response_format: { type: "json_object" } });
                 responseText = response.choices[0].message.content;
            } else if (aiProvider === 'claude') {
                const anthropic = new Anthropic({ apiKey });
                const response = await anthropic.messages.create({
                    model: "claude-3-haiku-20240307",
                    max_tokens: 2048,
                    messages: [{ role: "user", content: `${prompt}\n\nIMPORTANT: Respond with ONLY the raw JSON object.` }]
                });
                const block = response.content.find(b => b.type === 'text');
                if (block && block.type === 'text') {
                    responseText = block.text;
                } else {
                    throw new Error("Claude did not return a valid text response.");
                }
            }
            
            if (!responseText) {
                throw new Error("AI provider returned an empty response.");
            }
            
            const parsedJson = JSON.parse(cleanAiResponse(responseText));
            const ideas = aiProvider === 'gemini' ? parsedJson : parsedJson.ideas;

            if (!Array.isArray(ideas)) {
                console.error("AI response was not in the expected array format. Raw response:", responseText, "Parsed JSON:", parsedJson);
                throw new Error("AI response was not in the expected format (an array of ideas).");
            }

            dispatch({ type: 'SET_POST_IDEAS', payload: ideas });
            addLog(`✅ Successfully generated ${ideas.length} post ideas.`);

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            addLog(`❌ Error generating post ideas: ${errorMessage}`);
            dispatch({ type: 'SET_RESULT', payload: { type: 'error', message: `Idea Generation Error: ${errorMessage}` } });
        } finally {
            dispatch({ type: 'SET_LOADING_STATE', payload: { ideas: false } });
        }
    }, [aiProvider, apiKeys, openRouterModel, fetchedUrls, addLog]);
    
    const handleGenerateImage = useCallback(async (prompt) => {
        const apiKey = apiKeys[aiProvider];
        if (!prompt || !apiKey) {
            throw new Error("Prompt or API key is missing for image generation.");
        };
        
        addLog(`🎨 Generating image for prompt: "${prompt}"`);
        try {
            let base64ImageBytes = '';
            if (aiProvider === 'gemini') {
                 const genai = new GoogleGenAI({ apiKey });
                 const response = await genai.models.generateImages({
                    model: 'imagen-3.0-generate-002',
                    prompt,
                    config: { numberOfImages: 1, outputMimeType: 'image/jpeg', aspectRatio: '16:9' },
                });
                base64ImageBytes = response.generatedImages[0].image.imageBytes;
            } else if (aiProvider === 'openai' || aiProvider === 'openrouter') {
                const clientOptions: any = { apiKey, dangerouslyAllowBrowser: true };
                if (aiProvider === 'openrouter') {
                    clientOptions.baseURL = "https://openrouter.ai/api/v1";
                }
                const openai = new OpenAI(clientOptions);

                const response = await openai.images.generate({
                    model: aiProvider === 'openrouter' ? "openai/dall-e-3" : "dall-e-3",
                    prompt,
                    n: 1,
                    size: "1792x1024",
                    response_format: "b64_json",
                });
                base64ImageBytes = response.data[0].b64_json;
            } else {
                throw new Error(`${aiProvider} does not support image generation.`);
            }

            if (base64ImageBytes) {
                addLog('✅ Image generated successfully.');
                return base64ImageBytes;
            } else {
                 throw new Error("Received no image data from the provider.");
            }
        } catch (error) {
            const errorMessage = error?.message || String(error);
            addLog(`❌ Image Generation Error: ${errorMessage}`);
            throw error;
        }
    }, [aiProvider, apiKeys, addLog]);
    
    const handleImageRegen = useCallback(async (type, id, prompt) => {
        const loadingKey = type === 'featured' ? 'featuredImage' : `infographic-${id}`;
        dispatch({ type: 'SET_LOADING_STATE', payload: { [loadingKey]: true } });

        try {
            const base64 = await handleGenerateImage(prompt);
            if (type === 'featured') {
                dispatch({ type: 'UPDATE_FINAL_POST', payload: { featuredImage: { ...featuredImage, base64, prompt } } });
            } else {
                const newInfographics = infographics.map(info => 
                    info.id === id ? { ...info, base64, imagePrompt: prompt } : info
                );
                dispatch({ type: 'UPDATE_FINAL_POST', payload: { infographics: newInfographics } });
            }
        } catch (e) {
            // Error is already logged by handleGenerateImage
        } finally {
            dispatch({ type: 'SET_LOADING_STATE', payload: { [loadingKey]: false } });
        }
    }, [handleGenerateImage, featuredImage, infographics, dispatch]);
    
    const generatePostLogic = useCallback(async (contentToProcess, isUpdate = false, clusterContext = null) => {
        const apiKey = apiKeys[aiProvider];
        if (!apiKey) throw new Error(`API Key for ${aiProvider} is not set.`);
        
        const updateInstructions = isUpdate ? `
# TASK: UPDATE EXISTING CONTENT
You are updating an existing article. Your mission is to substantially improve it.
- **Analyze the original content** provided in the "Raw Text" section.
- **Refresh outdated information** and add new, relevant details based on a fresh competitive analysis.
- **Enhance SEO, readability, and engagement** using the Alex Hormozi style.
- **The final output must be a complete, superior replacement for the old article**, following all other structural and JSON format rules.
` : '';

        const systemInstruction = `You are "The Optimizer," a world-class SEO content strategist embodying the style of Alex Hormozi. Your directive is to transform raw text into a pillar blog post of at least 1800 words. Your core principles are extreme value, brutal honesty, and actionable frameworks. You don't write fluff; you deliver dense, high-impact content that solves problems. Every sentence must serve a purpose. Your mission is to create content so valuable that it becomes the definitive resource on the topic, ensuring it outranks all competitors. You are an expert at analyzing search results to find and exploit content gaps. Failure to follow all instructions, especially the JSON format, is not an option. You must inject critical thinking and your own unique perspective to make the content feel authentic and written by a seasoned expert.`;

        const urlsForContext = fetchedUrls;
        let linkingInstruction;

        if (clusterContext) {
            const { plan, currentTitle } = clusterContext;
            const otherArticles = [plan.pillar, ...plan.clusters].filter(p => p.title !== currentTitle).map(p => p.title);
            const isPillar = currentTitle === plan.pillar.title;

            if (isPillar) {
                 linkingInstruction = `**CRITICAL INTERNAL LINKING DIRECTIVE:** This is the PILLAR post of a topical cluster. You are REQUIRED to link to AT LEAST 5 of the supporting cluster posts. Here is the list of cluster posts to link to: ${plan.clusters.map(c => c.title).join('; ')}. The anchor text must be natural, keyword-rich, and contextually appropriate. Do not place links in headings. Do not link to any other URLs.`;
            } else {
                 linkingInstruction = `**CRITICAL INTERNAL LINKING DIRECTIVE:** This article is a CLUSTER post. You are REQUIRED to link back to the central PILLAR post: "${plan.pillar.title}". You SHOULD also link to 1-2 other relevant CLUSTER posts from this list: ${otherArticles.filter(t => t !== plan.pillar.title).join('; ')}. The anchor text must be natural and contextually appropriate. Do not place links in headings. Do not link to any other URLs.`;
            }
        } else if (urlsForContext.length > 0) {
            linkingInstruction = `**CRITICAL INTERNAL LINKING DIRECTIVE:** You are required to insert between 6 and 10 relevant internal links into the main body of the article. These links **MUST ONLY** be chosen from the "Website URLs for Context & Internal Linking" list provided below. Do not use any other URLs for internal links. The anchor text must be natural, keyword-rich, and contextually appropriate. Do not place links in headings.`;
        } else {
            linkingInstruction = `**CRITICAL INTERNAL LINKING DIRECTIVE:** You are strictly forbidden from adding any internal links to this article. The necessary list of site URLs was not provided. Do not invent links or use URLs from your general knowledge. This is a non-negotiable rule.`;
        }

        const categoryNames = state.wpCategories.map(c => c.name);
        let categoryInstruction;
        let categoryListForPrompt;

        if (categoryNames.length > 0) {
            categoryInstruction = `Select the SINGLE most relevant category for this article from the 'Website Categories' list provided below. The output MUST be an array containing ONLY that one category name. Do not invent new categories.`;
            categoryListForPrompt = `**Website Categories for Context:**\n---\n${categoryNames.join('\n')}\n---`;
        } else {
            // Fallback if categories couldn't be fetched
            categoryInstruction = `1-2 relevant categories.`;
            categoryListForPrompt = `**Website Categories for Context:**\n---\nN/A - Please generate appropriate categories based on the content.\n---`;
        }

        const basePrompt = `
${updateInstructions}

# STRATEGIC EXECUTION
You will perform the following sequence:
1.  **Deconstruct Input:** Identify the primary keyword and user intent from the "Raw Text".
2.  **SERP & Gap Analysis (Use Search Grounding):**
    *   Analyze the top 5 Google results for the primary keyword.
    *   Identify ALL "People Also Ask" (PAA) questions and "People also search for" (PASF) queries.
    *   Identify all relevant LSI (Latent Semantic Indexing) keywords related to the main topic.
    *   **CRITICAL:** Pinpoint the content gaps. What are competitors NOT covering? What questions are they answering poorly? Your entire article will be built around filling these gaps to create a superior resource.
3.  **Content Generation:**
    *   **Write an article of at least 1800 words** that is deeply helpful, authoritative, and easy to read. It should comprehensively cover the topic.
    *   **Inject Authenticity:** Infuse the writing with critical thinking, unique insights, and a strong, authoritative voice. Adopt the persona of an experienced expert, using anecdotes or strong opinions to build trust. Explain the 'why' behind the 'what'.
    *   **Readability:** Break down complex topics into simple concepts. Use short paragraphs, analogies, and real-world examples.
    *   **Structure:** Use clear headings (H2, H3), lists, and bold text for scannability.
    *   **Integrate Keywords:** Naturally weave the primary keyword, PAA/PASF questions, and LSI keywords throughout the text.
    *   **Internal Linking:** ${linkingInstruction}
4.  **JSON Formatting:** Structure your complete output according to the "JSON OUTPUT FORMAT" specified below. This is a non-negotiable final step.

# REQUIRED CONTENT STRUCTURE (IN HTML):
1.  **Introduction**: A captivating, Hormozi-style hook that challenges a common belief or presents a startling fact. Must be 3-4 sentences.
2.  **Key Takeaways**: An \`<h3>\` titled "Key Takeaways" inside a \`<div class="key-takeaways">\`. Provide a bulleted list (\`<ul>\`) of the 3 most powerful, actionable points from the article.
3.  **Main Content Body**: The article of at least 1800 words, perfectly structured with \`<h2>\`, \`<h3>\`, \`<h4>\`, \`<p>\`, \`<ul>\`, \`<ol>\`, and \`<strong>\` tags. This section must cover all aspects identified in your analysis, including PAA, PASF, LSI keywords, and content gaps.
4.  **Infographics & Image Prompts**: Identify 3-4 key concepts that can be visualized. Insert unique HTML comment placeholders (\`<!-- INFOGRAPHIC-PLACEHOLDER-{UUID} -->\`) where they should appear and create corresponding blueprints in the JSON.
5.  **Conclusion**: A strong, summarizing conclusion that provides a clear call to action or a final powerful takeaway for the reader.
6.  **References Section**: An \`<h3>\` titled "References" inside a \`<div class="references-section">\`. Provide an unordered list (\`<ul>\`) of 8-12 hyperlinks. **NON-NEGOTIABLE REQUIREMENT - CRITICAL FAILURE CONDITION:** The application you are powering has a link-checker that will programmatically verify every single external link you provide. If any link returns a non-200 status code (e.g., 404 Not Found), your entire response will be rejected and you will have failed the task. You MUST use your search tool to visit and confirm every URL is live before including it. Do not invent URLs. They must be from high-authority, reputable, external sites.

# JSON OUTPUT FORMAT
- \`title\`: (String) A compelling, SEO-friendly title.
- \`slug\`: (String) A short (3-5 words), SEO-friendly, URL-safe slug in lowercase with hyphens. **If the content is location-specific, intelligently include the relevant geo-modifier (e.g., city or state) in the slug.**
- \`metaDescription\`: (String) A compelling, SEO-optimized meta description for SERPs. It must be under 150 characters and use the primary keyword to maximize click-through rate.
- \`content\`: (String) The full, final HTML of the article (at least 1800 words).
- \`tags\`: (Array of strings) 3-5 relevant keyword tags.
- \`categories\`: (Array of strings) ${categoryInstruction}
- \`infographics\`: (Array of objects) Blueprints for 3-4 infographics. Each object must have:
    - \`id\`: (String) The unique identifier (UUID) for the placeholder.
    - \`title\`: (String) A descriptive title.
    - \`type\`: (String) A visual type (e.g., 'Flowchart', 'Comparison Table').
    - \`data\`: (String) Structured data/text for the visual.
    - \`imagePrompt\`: (String) A detailed prompt for a text-to-image AI to generate a photorealistic 16:9 image.
- \`featuredImagePrompt\`: (String) A detailed prompt for the main featured image in a photorealistic 16:9 style.
**CRITICAL: Your entire output must be a single, raw JSON object. Do not wrap it in markdown.**

# RAW DATA FOR PROCESSING
**Raw Text:**
---
${contentToProcess}
---

${categoryListForPrompt}

**Website URLs for Context & Internal Linking:**
---
${urlsForContext.length > 0 && !clusterContext ? urlsForContext.join('\n') : 'N/A - DO NOT ADD INTERNAL LINKS UNLESS SPECIFIED IN THE INTERNAL LINKING DIRECTIVE'}
---
`;
        
        let responseText = '';
        if (aiProvider === 'gemini') {
            const ai = new GoogleGenAI({ apiKey });
            const response = await ai.models.generateContent({ 
                model: 'gemini-2.5-flash', 
                contents: basePrompt, 
                config: { tools: [{googleSearch: {}}], systemInstruction: systemInstruction } 
            });
            responseText = response.text;
        } else if (aiProvider === 'openai' || (aiProvider === 'openrouter' && openRouterModel)) {
             const clientOptions: any = { apiKey, dangerouslyAllowBrowser: true };
             if (aiProvider === 'openrouter') clientOptions.baseURL = "https://openrouter.ai/api/v1";
             const openai = new OpenAI(clientOptions);
             const model = aiProvider === 'openai' ? 'gpt-4o' : openRouterModel;
             addLog(`Using model: ${model}`);
             const response = await openai.chat.completions.create({ 
                 model, 
                 messages: [{ role: "system", content: systemInstruction }, { role: "user", content: basePrompt }], 
                 response_format: { type: "json_object" } 
             });
             responseText = response.choices[0].message.content;
        } else if (aiProvider === 'claude') {
            const anthropic = new Anthropic({ apiKey });
            const response = await anthropic.messages.create({ 
                model: "claude-3-haiku-20240307", 
                max_tokens: 4096, 
                system: systemInstruction,
                messages: [{ role: "user", content: `${basePrompt}` }]
            });
            const block = response.content.find(b => b.type === 'text');
            if (block && block.type === 'text') responseText = block.text;
        }

        try {
            return JSON.parse(cleanAiResponse(responseText));
        } catch (e) {
            addLog(`❌ AI Error: Failed to parse AI response as JSON.`);
            addLog(`Raw AI Response: ${responseText}`);
            throw new Error('AI failed to generate a valid JSON response.');
        }
    }, [aiProvider, apiKeys, openRouterModel, fetchedUrls, addLog, state.wpCategories]);

    const handleGenerateContent = useCallback(async (contentOverride = null) => {
        dispatch({ type: 'CLEAR_LOGS' });
        dispatch({ type: 'SET_LOADING_STATE', payload: { content: true, featuredImage: false } });

        const contentToProcess = contentOverride !== null ? contentOverride : rawContent;
        const isUpdate = state.postToUpdate !== null;
        const logMessage = isUpdate ? `🤖 Updating existing post. Contacting ${aiProvider}...` : `🤖 Contacting ${aiProvider} for content strategy...`;
        addLog(logMessage);

        try {
            const parsedResponse = await generatePostLogic(contentToProcess, isUpdate);
            let { title, content, slug, metaDescription, tags, categories, infographics: infographicBlueprints, featuredImagePrompt } = parsedResponse;
            
             // --- Phase 1.5: Verify and Correct Reference Links ---
            addLog('🕵️ Verifying reference link validity...');
            try {
                const parser = new DOMParser();
                const doc = parser.parseFromString(content, 'text/html');
                const referenceLinks = Array.from(doc.querySelectorAll('.references-section a'));

                if (referenceLinks.length > 0) {
                    const CORS_PROXY = 'https://corsproxy.io/?';
                    const linkChecks = referenceLinks.map(link => {
                        const url = link.getAttribute('href');
                        if (!url) return Promise.resolve({ url: '', ok: false, status: 0 });
                        return fetch(`${CORS_PROXY}${encodeURIComponent(url)}`, { method: 'HEAD' })
                            .then(res => ({ url, ok: res.ok, status: res.status }))
                            .catch(() => ({ url, ok: false, status: 0 }));
                    });

                    const results = await Promise.all(linkChecks);
                    const brokenLinks = results.filter(res => !res.ok).map(res => res.url).filter(Boolean);

                    if (brokenLinks.length > 0) {
                        addLog(`⚠️ Found ${brokenLinks.length} broken reference links. Asking AI for replacements...`);
                        addLog(`Broken URLs: ${brokenLinks.join(', ')}`);

                        const correctionPrompt = `You are a link correction specialist. Your task is to find high-quality, relevant, and working replacements for a list of broken URLs for a blog post.\n\n**Blog Post Title:** "${title}"\n\n**Broken URLs:**\n${brokenLinks.map(url => `- ${url}`).join('\n')}\n\n**Instructions:**\n1. For each broken URL, find a new, 100% working, and topically relevant URL from a high-authority domain.\n2. The replacement link MUST lead to a live webpage (HTTP 200 OK).\n3. The content of the new page must be highly relevant to the original (presumably intended) content of the broken link.\n4. Respond with ONLY a raw JSON object mapping the original broken URL to the new, working URL. Do not include any other text, explanations, or markdown.\n\n**JSON Output Format:**\n{\n  "original_broken_url_1": "new_working_url_1",\n  "original_broken_url_2": "new_working_url_2"\n}`;
                        
                        let correctionText = '';
                        const apiKey = apiKeys[aiProvider];
                        if (aiProvider === 'gemini') {
                            const ai = new GoogleGenAI({ apiKey });
                            const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: correctionPrompt, config: { tools: [{googleSearch: {}}] } });
                            correctionText = response.text;
                        } else if (aiProvider === 'openai' || aiProvider === 'openrouter') {
                            const clientOptions: any = { apiKey: apiKey, dangerouslyAllowBrowser: true };
                            if (aiProvider === 'openrouter') clientOptions.baseURL = "https://openrouter.ai/api/v1";
                            const openai = new OpenAI(clientOptions);
                            const model = aiProvider === 'openai' ? 'gpt-4o' : openRouterModel;
                            const response = await openai.chat.completions.create({ model, messages: [{ role: "user", content: correctionPrompt }], response_format: { type: "json_object" } });
                            correctionText = response.choices[0].message.content;
                        } else if (aiProvider === 'claude') {
                            const anthropic = new Anthropic({ apiKey: apiKey });
                            const response = await anthropic.messages.create({ model: "claude-3-haiku-20240307", max_tokens: 1024, messages: [{ role: "user", content: correctionPrompt }] });
                            const block = response.content.find(b => b.type === 'text');
                            if (block?.type === 'text') correctionText = block.text;
                        }

                        try {
                            const replacements = JSON.parse(cleanAiResponse(correctionText));
                            referenceLinks.forEach(link => {
                                const originalHref = link.getAttribute('href');
                                if (originalHref && replacements[originalHref]) {
                                    const newHref = replacements[originalHref];
                                    addLog(`🔧 Replacing ${originalHref} with ${newHref}`);
                                    link.setAttribute('href', newHref);
                                    if (link.textContent === originalHref) {
                                        link.textContent = newHref;
                                    }
                                }
                            });
                            content = doc.body.innerHTML;
                            addLog('✅ All broken links have been replaced.');
                        } catch(e) {
                            addLog(`❌ Failed to parse link correction response from AI. Broken links may remain. Raw response: ${correctionText}`);
                        }
                    } else {
                        addLog('✅ All reference links verified and are working.');
                    }
                } else {
                    addLog('ℹ️ No reference links found to verify.');
                }
            } catch (verificationError) {
                addLog(`🟡 Could not verify reference links: ${verificationError.message}. Proceeding with original links.`);
            }

            if (isUpdate) {
                const postToUpdate = state.wpPosts.find(p => p.id === state.postToUpdate);
                if (postToUpdate) {
                    dispatch({ type: 'SET_DUPLICATE_INFO', payload: { similarUrl: postToUpdate.link, postId: postToUpdate.id } });
                    dispatch({ type: 'SET_PUBLISH_MODE', payload: 'update' });
                }
            }

            dispatch({type: 'SET_GENERATED_CONTENT', payload: {
                finalTitle: title,
                finalContent: content,
                slug: slug || '',
                metaDescription: metaDescription || '',
                tags: tags || [],
                categories: categories || [],
                featuredImage: { prompt: featuredImagePrompt, base64: '' },
                infographics: (infographicBlueprints || []).map(bp => ({ ...bp, base64: '' })),
            }});

            addLog('✅ Text generation complete.');

            const urlsForDuplicateCheck = fetchedUrls;

            if (!isUpdate) {
                addLog('Checking for duplicate content...');
                if (urlsForDuplicateCheck.length > 0 && wpUrl && wpUser && wpPassword) {
                    const activeApiKey = apiKeys[aiProvider];
                    if (activeApiKey) {
                        try {
                            const duplicateCheckPrompt = `You are an SEO assistant. A new blog post with the title "${title}" is being created. Based on this title, find the SINGLE most similar URL from the following list. Respond with ONLY the URL if a strong match is found, otherwise respond with the exact string "null".\n\nURL List:\n${urlsForDuplicateCheck.join('\n')}`;
                            let similarUrl = 'null';

                            if (aiProvider === 'gemini') {
                                const ai = new GoogleGenAI({ apiKey: activeApiKey });
                                const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: duplicateCheckPrompt, config: { thinkingConfig: { thinkingBudget: 0 } } });
                                similarUrl = response.text.trim();
                            } else if (aiProvider === 'openai' || aiProvider === 'openrouter') {
                                const clientOptions: any = { apiKey: activeApiKey, dangerouslyAllowBrowser: true };
                                if (aiProvider === 'openrouter') clientOptions.baseURL = "https://openrouter.ai/api/v1";
                                const openai = new OpenAI(clientOptions);
                                const model = aiProvider === 'openai' ? 'gpt-4o' : openRouterModel;
                                const response = await openai.chat.completions.create({ model, messages: [{ role: "user", content: duplicateCheckPrompt }], max_tokens: 100 });
                                similarUrl = response.choices[0].message.content.trim();
                            } else if (aiProvider === 'claude') {
                                const anthropic = new Anthropic({ apiKey: activeApiKey });
                                const response = await anthropic.messages.create({ model: "claude-3-haiku-20240307", max_tokens: 100, messages: [{ role: 'user', content: duplicateCheckPrompt }] });
                                const block = response.content.find(b => b.type === 'text');
                                if (block && block.type === 'text') similarUrl = block.text.trim();
                            }
                            
                            if (similarUrl.toLowerCase() !== 'null' && similarUrl.startsWith('http')) {
                                addLog(`⚠️ Potential duplicate identified: ${similarUrl}. Verifying...`);
                                let postSlug = new URL(similarUrl).pathname.match(/([^/]+)\/?$/)?.[1];
                                if (postSlug) {
                                    const credentials = btoa(`${wpUser}:${wpPassword}`);
                                    const searchApiUrl = `${wpUrl.replace(/\/$/, '')}/wp-json/wp/v2/posts?slug=${postSlug}&_fields=id`;
                                    const searchResponse = await fetch(searchApiUrl, { headers: { 'Authorization': `Basic ${credentials}` } });
                                    if (searchResponse.ok) {
                                        const posts = await searchResponse.json();
                                        if (posts && posts.length > 0) {
                                            const postId = posts[0].id;
                                            addLog(`✅ Existing post found (ID: ${postId}). You can choose to update it in the next step.`);
                                            dispatch({ type: 'SET_DUPLICATE_INFO', payload: { similarUrl, postId } });
                                            dispatch({ type: 'SET_PUBLISH_MODE', payload: 'update' });
                                        }
                                    }
                                }
                            } else {
                                addLog('✅ No significant content overlap found. Good to publish as new.');
                            }
                        } catch (dupError) {
                            addLog(`🟡 Warning during duplicate check: ${dupError.message}. Proceeding to publish as new.`);
                        }
                    } else {
                        addLog(`🟡 Skipping duplicate content check: ${aiProvider} API key not provided.`);
                    }
                } else {
                    addLog('ℹ️ Skipping duplicate content check (Sitemap URLs or WP credentials not provided).');
                }
            }
            
            // --- Phase 2: Concurrently Generate All Images ---
            addLog('🎨 Starting concurrent image generation...');
            const imageTasks = [
                { type: 'featured', id: 'featured', prompt: featuredImagePrompt },
                ...(infographicBlueprints || []).map(info => ({ type: 'infographic', id: info.id, prompt: info.imagePrompt }))
            ];

            const imagePromises = imageTasks.map(task => 
                handleGenerateImage(task.prompt).then(base64 => ({...task, base64, status: 'fulfilled'}))
                                                .catch(error => ({...task, error, status: 'rejected'}))
            );

            const imageResults = await Promise.all(imagePromises);

            let newFeaturedImage = state.featuredImage;
            const newInfographics = [...(infographicBlueprints || [])].map(bp => ({...bp, base64: ''}));

            imageResults.forEach(result => {
                if (result.status === 'fulfilled') {
                    if (result.type === 'featured') {
                        newFeaturedImage = { prompt: result.prompt, base64: result.base64 };
                    } else {
                        const infoIndex = newInfographics.findIndex(info => info.id === result.id);
                        if (infoIndex !== -1) {
                            newInfographics[infoIndex].base64 = result.base64;
                        }
                    }
                }
            });
            
            dispatch({ type: 'UPDATE_FINAL_POST', payload: { featuredImage: newFeaturedImage, infographics: newInfographics }});
            addLog('🎉 All images generated. Ready for review!');

        } catch (error) {
            let errorMessage = error?.message || String(error);
            try { const errorJson = JSON.parse(errorMessage); if (errorJson?.error?.message) errorMessage = errorJson.error.message; } catch (e) { /* ignore */ }
            addLog(`❌ AI Error: ${errorMessage}`);
            dispatch({ type: 'SET_RESULT', payload: { type: 'error', message: `AI error: ${errorMessage}` } });
        } finally {
            dispatch({ type: 'SET_LOADING_STATE', payload: { content: false } });
        }
    }, [aiProvider, apiKeys, openRouterModel, rawContent, fetchedUrls, wpUrl, wpUser, wpPassword, addLog, handleGenerateImage, generatePostLogic, state.postToUpdate, state.wpCategories, state.wpPosts]);

    const handleGenerateBatch = useCallback(async () => {
        const jobs = batchTopics.split('\n').filter(t => t.trim()).map(title => ({ id: Date.now() + Math.random(), title, status: 'queued', result: null }));
        if (jobs.length === 0) return;
        
        dispatch({ type: 'START_BATCH_GENERATION', payload: jobs });

        const generateSinglePost = async (job) => {
            dispatch({ type: 'UPDATE_BATCH_JOB_STATUS', payload: { id: job.id, status: 'processing' } });
            addLog(`🤖 Starting batch job: "${job.title}"`);
            const result = await generatePostLogic(job.title, false);
            const { title, content, slug, metaDescription, tags, categories, infographics: infographicBlueprints, featuredImagePrompt } = result;
            return {
                content: {
                    finalTitle: title,
                    finalContent: content,
                    slug, metaDescription, tags, categories,
                    featuredImage: { prompt: featuredImagePrompt, base64: '' },
                    infographics: (infographicBlueprints || []).map(bp => ({ ...bp, base64: '' })),
                },
                postId: null,
                postLink: null,
            };
        };

        let successCount = 0;
        let errorCount = 0;

        const onProgress = ({ item: job, result, success, error }: { item: typeof jobs[0], result?: Awaited<ReturnType<typeof generateSinglePost>>, index: number, success: boolean, error?: Error }) => {
            const finalResult = success ? result : error?.message || 'An unknown error occurred.';
            if (success) {
                successCount++;
                addLog(`✅ Batch job finished: "${job.title}"`);
            } else {
                errorCount++;
                addLog(`❌ Batch job failed: "${job.title}" - ${finalResult}`);
            }
            
            dispatch({
                type: 'UPDATE_BATCH_JOB_STATUS',
                payload: { id: job.id, status: success ? 'done' : 'error', result: finalResult }
            });
        };

        await processConcurrentPromiseQueue(jobs, generateSinglePost, onProgress, 3);

        addLog(`🎉 Batch generation complete. ${successCount} successful, ${errorCount} failed.`);
        dispatch({ type: 'FINISH_BATCH_GENERATION' });
    }, [generatePostLogic, addLog, batchTopics]);
    
    const handleGenerateClusterPlan = useCallback(async () => {
        if (state.wpPosts.length === 0) {
            addLog('❌ Cannot generate cluster plan. Please load your published posts from WordPress first.');
            return;
        }
        dispatch({ type: 'CLEAR_LOGS' });
        dispatch({ type: 'START_PLAN_GENERATION' });
        addLog(`🧠 Strategizing topical cluster for "${clusterTopic}"...`);
        try {
            const apiKey = apiKeys[aiProvider];
            if (!apiKey) throw new Error(`${aiProvider} API Key is required.`);
            
            const existingPostTitles = state.wpPosts.map(p => p.title.rendered).join('\n');

            const prompt = `You are a world-class SEO content strategist with deep expertise in establishing topical authority and avoiding keyword cannibalization. Your judgment is paramount.

Your task is to analyze a core topic AND a list of existing blog post titles from a website. Based on this, you will generate a strategic topical cluster plan.

### CORE OBJECTIVES:
1.  **Achieve Topical Authority**: The plan must be comprehensive, covering the core topic from a main "pillar" article and multiple specific "cluster" articles.
2.  **Integrate Existing Content**: You MUST leverage the existing articles. Identify which ones fit into the new cluster. This is your highest priority.
3.  **Prevent Keyword Cannibalization**: DO NOT suggest new article topics that are already well-covered by existing posts. This is a critical failure condition. You must be 1,000,000% certain a new topic is a genuine content gap before suggesting it.

### INSTRUCTIONS:
1.  **Analyze the Core Topic**: Understand the user intent and semantic space of: "${clusterTopic}".
2.  **Analyze Existing Articles**: Review the provided list of "Existing Article Titles".
3.  **Develop the Plan**:
    *   **Pillar Post**: Define ONE pillar post.
        *   If a suitable, comprehensive existing article is found, designate it as the pillar. Use its **exact title** from the provided list and mark its status as 'existing'.
        *   If no existing article is suitable, create a title for a NEW pillar post and mark its status as 'new'.
    *   **Cluster Posts**: Define 5-7 supporting cluster posts.
        *   For each supporting sub-topic, first check if an existing article already covers it. If yes, include that article, using its **exact title** from the provided list, and mark its status as 'existing'.
        *   If a sub-topic is a content gap (i.e., not covered by existing articles), create a title for a NEW cluster post to fill that gap and mark its status as 'new'.
4.  **JSON Output**: Your response MUST be ONLY a raw JSON object. Do not include any other text, explanations, or markdown.

### REQUIRED JSON OUTPUT FORMAT:
The JSON object must have two keys: "pillar" and "clusters".
-   \`pillar\`: An object with two keys:
    -   \`title\`: (String) The title of the pillar article.
    -   \`status\`: (String) Either "new" or "existing".
-   \`clusters\`: An array of objects, where each object has:
    -   \`title\`: (String) The title of the cluster article.
    -   \`status\`: (String) Either "new" or "existing".

### DATA FOR ANALYSIS:

**Core Topic:**
"${clusterTopic}"

**Existing Article Titles:**
---
${existingPostTitles}
---`;

            let responseText = '';
            if (aiProvider === 'gemini') {
                 const ai = new GoogleGenAI({ apiKey });
                 const postStatusType = {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        status: { type: Type.STRING, enum: ['new', 'existing'] },
                    },
                    required: ['title', 'status']
                 };
                 const responseSchema = {
                    type: Type.OBJECT,
                    properties: {
                        pillar: postStatusType,
                        clusters: { type: Type.ARRAY, items: postStatusType },
                    },
                    required: ['pillar', 'clusters'],
                 };
                 const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: 'application/json', responseSchema } });
                 responseText = response.text;
            } else {
                 const clientOptions: any = { apiKey, dangerouslyAllowBrowser: true };
                 if (aiProvider === 'openrouter') clientOptions.baseURL = "https://openrouter.ai/api/v1";
                 const openai = new OpenAI(clientOptions);
                 const model = aiProvider === 'openai' ? 'gpt-4o' : (openRouterModel || 'openai/gpt-4o');
                 const response = await openai.chat.completions.create({ model, messages: [{ role: "user", content: prompt }], response_format: { type: "json_object" } });
                 responseText = response.choices[0].message.content;
            }

            const planFromAI = JSON.parse(cleanAiResponse(responseText));
            if (!planFromAI.pillar || !Array.isArray(planFromAI.clusters)) {
                throw new Error("AI returned an invalid plan structure.");
            }

            // Post-process to add URLs to existing posts
            const titleToLinkMap = new Map(state.wpPosts.map(p => [p.title.rendered, p.link]));
            const finalPlan = {
                pillar: {
                    ...planFromAI.pillar,
                    url: planFromAI.pillar.status === 'existing' ? titleToLinkMap.get(planFromAI.pillar.title) : undefined
                },
                clusters: planFromAI.clusters.map(cluster => ({
                    ...cluster,
                    url: cluster.status === 'existing' ? titleToLinkMap.get(cluster.title) : undefined
                }))
            };

            dispatch({ type: 'SET_CLUSTER_PLAN', payload: finalPlan });
            addLog(`✅ Cluster plan generated for "${clusterTopic}".`);

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            addLog(`❌ Error generating cluster plan: ${errorMessage}`);
        } finally {
            dispatch({ type: 'FINISH_PLAN_GENERATION' });
        }
    }, [aiProvider, apiKeys, openRouterModel, clusterTopic, addLog, state.wpPosts]);
    
    const handleGenerateClusterArticles = useCallback(async () => {
        if (!clusterPlan) return;
        
        const newArticlesToGenerate = [clusterPlan.pillar, ...clusterPlan.clusters].filter(p => p.status === 'new');
        if (newArticlesToGenerate.length === 0) {
            addLog('ℹ️ No new articles to generate in this cluster plan.');
            return;
        }

        const allTitles = newArticlesToGenerate.map(p => p.title);
        const jobs = allTitles.map(title => ({ id: Date.now() + Math.random(), title, status: 'queued', result: null }));
        
        dispatch({ type: 'START_BATCH_GENERATION', payload: jobs });
        
        const generateSingleClusteredPost = async (job) => {
            dispatch({ type: 'UPDATE_BATCH_JOB_STATUS', payload: { id: job.id, status: 'processing' }});
            addLog(`🤖 Generating cluster article: "${job.title}"`);
            const result = await generatePostLogic(job.title, false, { plan: clusterPlan, currentTitle: job.title });
            const { title, content, slug, metaDescription, tags, categories, infographics: infographicBlueprints, featuredImagePrompt } = result;
            return {
                finalTitle: title,
                finalContent: content,
                slug, metaDescription, tags, categories,
                featuredImage: { prompt: featuredImagePrompt, base64: '' },
                infographics: (infographicBlueprints || []).map(bp => ({ ...bp, base64: '' })),
            };
        };

        const onProgress = ({ item: job, result, success, error }: { item: typeof jobs[0], result?: Awaited<ReturnType<typeof generateSingleClusteredPost>>, error?: Error, index: number, success: boolean }) => {
            const finalResult = success ? result : error?.message || 'An unknown error occurred.';
            addLog(success ? `✅ Finished cluster article: "${job.title}"` : `❌ Failed cluster article: "${job.title}" - ${finalResult}`);
            dispatch({ type: 'UPDATE_BATCH_JOB_STATUS', payload: { id: job.id, status: success ? 'done' : 'error', result: finalResult } });
        };
        
        await processConcurrentPromiseQueue(jobs, generateSingleClusteredPost, onProgress, 3);

        addLog(`🎉 Cluster generation complete.`);
        dispatch({ type: 'FINISH_BATCH_GENERATION' });

    }, [clusterPlan, generatePostLogic, addLog]);

    const handleLoadBatchResultForReview = useCallback((result) => {
        dispatch({ type: 'LOAD_BATCH_RESULT_FOR_REVIEW', payload: result });
        addLog('📝 Loaded result for review. Generating images...');
        
        const imageTasks = [
            { type: 'featured', id: 'featured', prompt: result.content.featuredImage.prompt },
            ...result.content.infographics.map(info => ({ type: 'infographic', id: info.id, prompt: info.imagePrompt }))
        ];

        imageTasks.forEach(task => {
            if (task.prompt) {
                handleImageRegen(task.type, task.id, task.prompt);
            }
        });

    }, [handleImageRegen, addLog]);
    
    const handlePublishOrUpdate = useCallback(async (mode) => {
        dispatch({ type: 'CLEAR_LOGS' });
        dispatch({ type: 'SET_LOADING_STATE', payload: { publish: true } });

        const isUpdate = mode === 'update';
        const postId = state.postToUpdate || state.duplicateInfo.postId;

        if (isUpdate && !postId) {
            const errorMsg = 'Update Error: Missing Post ID. Cannot update.';
            addLog(`❌ ${errorMsg}`);
            dispatch({ type: 'SET_RESULT', payload: { type: 'error', message: errorMsg } });
            dispatch({ type: 'SET_LOADING_STATE', payload: { publish: false } });
            return;
        }

        addLog(isUpdate ? `🔄 Updating existing post (ID: ${postId}) at ${wpUrl}` : `⬆️ Publishing new post to ${wpUrl}`);
        
        try {
            const apiUrl = `${wpUrl.replace(/\/$/, '')}/wp-json/wp/v2`;
            const credentials = btoa(`${wpUser}:${wpPassword}`);
            const baseHeaders = { 'Authorization': `Basic ${credentials}` };

            addLog('🖼️ Uploading all images concurrently...');
            
            const uploadTasks = [];
            if (featuredImage.base64) {
                 uploadTasks.push({ type: 'featured', base64: featuredImage.base64, altText: finalTitle, filename: 'featured-image.jpg' });
            }
            infographics.forEach((info) => {
                if (info.base64) {
                     uploadTasks.push({ type: 'infographic', id: info.id, base64: info.base64, altText: info.title, filename: `infographic-${info.id}.jpg`});
                }
            });

            const uploadImage = async (task) => {
                const { base64, filename, altText } = task;
                const blob = await(await fetch(`data:image/jpeg;base64,${base64}`)).blob();
                const headers = { ...baseHeaders, 'Content-Type': 'image/jpeg', 'Content-Disposition': `attachment; filename="${filename}"`};
                const res = await fetch(`${apiUrl}/media`, { method: 'POST', headers, body: blob });
                if (!res.ok) throw new Error(`Failed to upload ${filename}: ${await res.text()}`);
                const data = await res.json();
                addLog(`✅ ${filename} uploaded (ID: ${data.id})`);
                
                await fetch(`${apiUrl}/media/${data.id}`, {
                    method: 'POST',
                    headers: {...baseHeaders, 'Content-Type': 'application/json'},
                    body: JSON.stringify({ alt_text: altText, title: altText })
                });

                return { ...task, mediaId: data.id, mediaUrl: data.source_url };
            };
            
            const uploadResults = await Promise.allSettled(uploadTasks.map(uploadImage));

            let featuredMediaId = null;
            const infographicUrlMap = new Map();
            uploadResults.forEach((result) => {
                if (result.status === 'fulfilled' && result.value) {
                    if (result.value.type === 'featured') {
                        featuredMediaId = result.value.mediaId;
                    } else if (result.value.type === 'infographic') {
                        infographicUrlMap.set(result.value.id, result.value.mediaUrl);
                    }
                } else if (result.status === 'rejected') {
                    addLog(`❌ Upload Error: ${result.reason}`);
                }
            });
            addLog('✅ All images uploaded.');

            let finalPostContent = finalContent;
            infographicUrlMap.forEach((url, id) => {
                const placeholderRegex = new RegExp(`<!-- INFOGRAPHIC-PLACEHOLDER-${id} -->`, 'g');
                const infographic = infographics.find(info => info.id === id);
                const altText = infographic ? infographic.title : 'Infographic';
                const imageTag = `<figure class="wp-block-image size-large"><img src="${url}" alt="${altText}"/></figure>`;
                finalPostContent = finalPostContent.replace(placeholderRegex, imageTag);
            });
             addLog('✅ Content updated with final image URLs.');

            const resolveTaxonomy = async (endpoint, terms, singularName, pluralName) => {
                if (!terms || terms.length === 0) return [];
                addLog(`🏷️ Resolving existing ${pluralName}...`);

                const response = await fetch(`${apiUrl}/${endpoint}?per_page=100&_fields=id,name`, { headers: baseHeaders });
                if (!response.ok) {
                    addLog(`⚠️ Could not fetch existing ${pluralName}. Skipping taxonomy assignment.`);
                    return [];
                }
                const existingTerms = await response.json();
                const existingTermsMap = new Map(existingTerms.map(term => [term.name.toLowerCase(), term.id]));

                const termIds = [];
                for (const termName of terms) {
                    const termId = existingTermsMap.get(termName.toLowerCase());
                    if (termId) {
                        termIds.push(termId);
                    } else {
                        addLog(`⚠️ Skipping non-existent ${singularName}: "${termName}". Please create it in WordPress first if needed.`);
                    }
                }
                
                addLog(`Found ${termIds.length} matching ${pluralName}.`);
                return termIds;
            };

            const [tagIds, categoryIds] = await Promise.all([
                resolveTaxonomy('tags', tags, 'tag', 'tags'),
                resolveTaxonomy('categories', categories, 'category', 'categories')
            ]);
            addLog('✅ Taxonomy resolved.');
            
            addLog(isUpdate ? `🚀 Applying updates to post...` : '🚀 Publishing post...');
            const postData = {
                title: finalTitle,
                slug: slug,
                content: finalPostContent,
                status: 'publish',
                excerpt: metaDescription,
                tags: tagIds,
                categories: categoryIds,
                ...(featuredMediaId && { featured_media: featuredMediaId })
            };

            const postEndpoint = isUpdate ? `${apiUrl}/posts/${postId}` : `${apiUrl}/posts`;
            const wpResponse = await fetch(postEndpoint, { method: 'POST', headers: {...baseHeaders, 'Content-Type': 'application/json'}, body: JSON.stringify(postData) });
            if (!wpResponse.ok) {
                 const errorData = await wpResponse.json();
                 throw new Error(`WP Error (${wpResponse.status}): ${errorData.message}`);
            }
            const postResult = await wpResponse.json();
            const resultAction = isUpdate ? 'updated' : 'published';

            addLog(`🎉 Successfully ${resultAction}!`);
            if (isUpdate) {
                dispatch({ type: 'MARK_POST_AS_UPDATED', payload: { id: postId } });
            }
            dispatch({ type: 'SET_RESULT', payload: { type: 'success', message: `Post ${resultAction}! <a href="${postResult.link}" target="_blank" rel="noopener noreferrer">View Post</a>` }});

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            const action = isUpdate ? 'Updating' : 'Publishing';
            addLog(`❌ ${action} Error: ${errorMessage}`);
            dispatch({ type: 'SET_RESULT', payload: { type: 'error', message: `${action} error: ${errorMessage}` } });
        } finally {
            dispatch({ type: 'SET_LOADING_STATE', payload: { publish: false } });
        }
    }, [wpUrl, wpUser, wpPassword, finalTitle, slug, metaDescription, finalContent, tags, categories, featuredImage, infographics, state.duplicateInfo, state.postToUpdate, addLog]);

     // New and modified handlers for cluster features
    const fetchWpContent = useCallback(async (postId) => {
        const apiUrl = `${wpUrl.replace(/\/$/, '')}/wp-json/wp/v2/posts/${postId}?_fields=content`;
        const credentials = btoa(`${wpUser}:${wpPassword}`);
        const headers = { 'Authorization': `Basic ${credentials}` };
        const response = await fetch(apiUrl, { headers });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Failed to fetch content for post ID ${postId}: ${errorData.message || 'Unknown error'}`);
        }
        const postData = await response.json();
        return postData.content.rendered;
    }, [wpUrl, wpUser, wpPassword]);
    
    const handleOptimizeClusterPost = useCallback(async (postTitle) => {
        const post = state.wpPosts.find(p => p.title.rendered === postTitle);
        if (!post) {
            addLog(`❌ Could not find post "${postTitle}" to optimize.`);
            return;
        }

        dispatch({ type: 'CLEAR_LOGS' });
        dispatch({ type: 'UPDATE_FIELD', payload: { field: 'postToUpdate', value: post.id } });
        addLog(`🚀 Preparing to optimize post: "${post.title.rendered}"`);
        
        try {
            const content = await fetchWpContent(post.id);
            await handleGenerateContent(content);
        } catch (error) {
            addLog(`❌ Error preparing optimization: ${error.message}`);
            dispatch({ type: 'SET_LOADING_STATE', payload: { content: false } });
            dispatch({ type: 'CLEAR_UPDATE_SELECTION' });
        }
    }, [state.wpPosts, fetchWpContent, handleGenerateContent, addLog]);

    const handleProcessFullCluster = useCallback(async () => {
        if (!clusterPlan) return;
        
        const allPostsInPlan = [clusterPlan.pillar, ...clusterPlan.clusters];
        const jobs = allPostsInPlan.map(p => ({
            id: Date.now() + Math.random(),
            title: p.title,
            status: p.status, // 'new' or 'existing'
            result: null
        }));

        dispatch({ type: 'START_BATCH_GENERATION', payload: jobs });
        
        const processClusterJob = async (job) => {
            dispatch({ type: 'UPDATE_BATCH_JOB_STATUS', payload: { id: job.id, status: 'processing' }});
            addLog(`⚙️ Processing cluster job: "${job.title}"`);
            
            const clusterContext = { plan: clusterPlan, currentTitle: job.title };
            let contentToProcess = job.title;
            let isUpdate = false;

            if (job.status === 'existing') {
                const post = state.wpPosts.find(p => p.title.rendered === job.title);
                if (!post) throw new Error(`Could not find existing post: ${job.title}`);
                contentToProcess = await fetchWpContent(post.id);
                isUpdate = true;
            }

            const result = await generatePostLogic(contentToProcess, isUpdate, clusterContext);
            const { title, content, slug, metaDescription, tags, categories, infographics: infographicBlueprints, featuredImagePrompt } = result;
            
            return {
                finalTitle: title,
                finalContent: content,
                slug, metaDescription, tags, categories,
                featuredImage: { prompt: featuredImagePrompt, base64: '' },
                infographics: (infographicBlueprints || []).map(bp => ({ ...bp, base64: '' })),
            };
        };

        const onProgress = ({ item: job, result, success, error }: { item: any, result?: any, error?: Error, success: boolean }) => {
            const finalResult = success ? result : error?.message || 'An unknown error occurred.';
            addLog(success ? `✅ Finished cluster article: "${job.title}"` : `❌ Failed cluster article: "${job.title}" - ${finalResult}`);
            dispatch({ type: 'UPDATE_BATCH_JOB_STATUS', payload: { id: job.id, status: success ? 'done' : 'error', result: finalResult } });
        };
        
        await processConcurrentPromiseQueue(jobs, processClusterJob, onProgress, 3);
        addLog(`🎉 Full cluster processing complete.`);
        dispatch({ type: 'FINISH_BATCH_GENERATION' });
    }, [clusterPlan, state.wpPosts, fetchWpContent, generatePostLogic, addLog]);

    const handleDiscoverClusters = useCallback(async () => {
        if (state.wpPosts.length === 0) {
            addLog('❌ Cannot discover clusters without posts. Please load them first.');
            return;
        }
        dispatch({ type: 'CLEAR_LOGS' });
        dispatch({ type: 'START_DISCOVER_CLUSTERS' });
        addLog('🤖 Analyzing your content library for cluster opportunities...');

        try {
            const apiKey = apiKeys[aiProvider];
            if (!apiKey) throw new Error(`${aiProvider} API key is required.`);
            const allPostTitles = state.wpPosts.map(p => p.title.rendered);
            
            const prompt = `You are a world-class SEO content strategist. Your task is to analyze a list of blog post titles and identify the top 4 most impactful topical cluster opportunities.

### INSTRUCTIONS:
1.  **Analyze Holistically**: Review the entire list of titles to understand the website's main areas of expertise and identify thematic groupings.
2.  **Identify High-Potential Clusters**: A good cluster has a strong, broad "pillar" topic and can be supported by multiple specific "cluster" posts. Look for groups of related articles that could be formalized into a powerful cluster to boost authority.
3.  **Define the Cluster Topic**: For each of the top 4 opportunities, define a clear and concise core topic (e.g., "Content Marketing for Startups").
4.  **Provide a Rationale**: Briefly explain *why* this is a strong cluster opportunity for this specific website. Mention how it connects existing content and where the potential for new content lies.
5.  **List Supporting Posts**: Identify 3-5 existing article titles from the provided list that would directly support this cluster topic. This is crucial for grounding your suggestion in the site's current reality.
6.  **JSON Output**: Your response MUST be ONLY a raw JSON object with a root key "opportunities". Do not include any other text, explanations, or markdown.

### REQUIRED JSON OUTPUT FORMAT:
{
  "opportunities": [
    {
      "topic": "The core topic for the cluster",
      "rationale": "A 2-3 sentence explanation of why this is a strategic cluster.",
      "supportingPosts": [
        "Exact title of an existing post that fits here",
        "Another exact title of a supporting post"
      ]
    }
  ]
}

### EXISTING ARTICLE TITLES FOR ANALYSIS:
---
${allPostTitles.join('\n')}
---
`;
            let responseText = '';
            if (aiProvider === 'gemini') {
                const ai = new GoogleGenAI({ apiKey });
                const responseSchema = {
                    type: Type.OBJECT,
                    properties: {
                        opportunities: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    topic: { type: Type.STRING },
                                    rationale: { type: Type.STRING },
                                    supportingPosts: { type: Type.ARRAY, items: { type: Type.STRING } }
                                },
                                required: ['topic', 'rationale', 'supportingPosts']
                            }
                        }
                    },
                    required: ['opportunities']
                };
                const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: 'application/json', responseSchema } });
                responseText = response.text;
            } else { // Fallback for OpenAI/OpenRouter
                const clientOptions: any = { apiKey, dangerouslyAllowBrowser: true };
                if (aiProvider === 'openrouter') clientOptions.baseURL = "https://openrouter.ai/api/v1";
                const openai = new OpenAI(clientOptions);
                const model = aiProvider === 'openai' ? 'gpt-4o' : (openRouterModel || 'openai/gpt-4o');
                const response = await openai.chat.completions.create({ model, messages: [{ role: "user", content: prompt }], response_format: { type: "json_object" } });
                responseText = response.choices[0].message.content;
            }

            const parsed = JSON.parse(cleanAiResponse(responseText));
            if (!parsed.opportunities || !Array.isArray(parsed.opportunities)) {
                throw new Error("AI returned data in an unexpected format.");
            }
            dispatch({ type: 'SET_SUGGESTED_CLUSTERS', payload: parsed.opportunities });
            addLog(`✅ Successfully identified ${parsed.opportunities.length} potential clusters.`);

        } catch (error) {
            addLog(`❌ Error discovering clusters: ${error.message}`);
        } finally {
            dispatch({ type: 'FINISH_DISCOVER_CLUSTERS' });
        }
    }, [aiProvider, apiKeys, openRouterModel, state.wpPosts, addLog]);

    const handleBulkUpdate = useCallback(async () => {
        const { selectedPosts, wpPosts } = state;
        if (selectedPosts.length === 0) return;

        const postsToUpdate = wpPosts.filter(p => selectedPosts.includes(p.id));

        const jobs = postsToUpdate.map(post => ({
            id: post.id,
            title: post.title.rendered,
            status: 'queued',
            result: null,
            postLink: post.link,
        }));

        dispatch({ type: 'START_BATCH_GENERATION', payload: jobs });
        dispatch({ type: 'TOGGLE_MULTI_SELECT_MODE' });

        const workspace = document.getElementById('workspace-container');
        if(workspace) {
            workspace.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        const processSingleUpdate = async (job) => {
            dispatch({ type: 'UPDATE_BATCH_JOB_STATUS', payload: { id: job.id, status: 'processing' } });
            addLog(`🤖 Starting bulk update for: "${job.title}"`);
            
            const content = await fetchWpContent(job.id);
            const result = await generatePostLogic(content, true);
            const { title, content: finalContent, slug, metaDescription, tags, categories, infographics: infographicBlueprints, featuredImagePrompt } = result;
            
            return {
                content: {
                    finalTitle: title,
                    finalContent,
                    slug, metaDescription, tags, categories,
                    featuredImage: { prompt: featuredImagePrompt, base64: '' },
                    infographics: (infographicBlueprints || []).map(bp => ({ ...bp, base64: '' })),
                },
                postId: job.id,
                postLink: job.postLink,
            };
        };
        
        const onProgress = ({ item: job, result, success, error }: {
            item: (typeof jobs)[0];
            result?: Awaited<ReturnType<typeof processSingleUpdate>>;
            index: number;
            success: boolean;
            error?: Error;
        }) => {
            const finalResult = success ? result : error?.message || 'An unknown error occurred.';
            addLog(success ? `✅ Bulk update finished: "${job.title}"` : `❌ Bulk update failed: "${job.title}" - ${finalResult}`);
            dispatch({
                type: 'UPDATE_BATCH_JOB_STATUS',
                payload: { id: job.id, status: success ? 'done' : 'error', result: finalResult }
            });
        };

        await processConcurrentPromiseQueue(jobs, processSingleUpdate, onProgress, 3);
        
        addLog(`🎉 Bulk update complete.`);
        dispatch({ type: 'FINISH_BATCH_GENERATION' });
    }, [state.selectedPosts, state.wpPosts, addLog, fetchWpContent, generatePostLogic]);


    const renderStep = () => {
        switch (state.step) {
            case 1:
                return <ConfigStep state={state} dispatch={dispatch} onFetchSitemap={handleFetchSitemap} onValidateKey={handleKeyValidation} onVerifyWpConnection={handleVerifyWpConnection} />;
            case 2:
                return <ContentStep state={state} dispatch={dispatch} onGenerateContent={handleGenerateContent} onFetchWpPosts={handleFetchWpPosts} onAnalyzeAndSelect={handleAnalyzeAndSelect} onGeneratePostIdeas={handleGeneratePostIdeas} onGenerateBatch={handleGenerateBatch} onLoadBatchResultForReview={handleLoadBatchResultForReview} onGenerateClusterPlan={handleGenerateClusterPlan} onGenerateClusterArticles={handleGenerateClusterArticles} onProcessFullCluster={handleProcessFullCluster} onDiscoverClusters={handleDiscoverClusters} onOptimizeClusterPost={handleOptimizeClusterPost} onBulkUpdate={handleBulkUpdate} />;
            case 3:
                return <ReviewPublishStep state={state} dispatch={dispatch} onPostAction={handlePublishOrUpdate} onImageRegen={handleImageRegen} />;
            default:
                return <div>Invalid Step</div>;
        }
    }
    
    const canNavigate = state.wpConnectionStatus === 'success' && state.keyStatus[state.aiProvider] === 'valid';
    const handleNavigation = (step) => dispatch({ type: 'SET_STEP', payload: step });

    return (
        <div className="app-container">
            <Sidebar currentStep={state.step} onNavigate={handleNavigation} canNavigate={canNavigate} />
            <main className="main-content">
                <ErrorBoundary>
                    {renderStep()}
                </ErrorBoundary>

                 {state.logs.length > 0 && (
                    <div className="status-container">
                        <ul className="status-log" aria-live="polite">
                            {state.logs.map((log, index) => <li key={index}>{log}</li>)}
                        </ul>
                    </div>
                )}

                {state.result && (
                    <div className={`result ${state.result.type}`} role="alert" dangerouslySetInnerHTML={{ __html: state.result.message }}>
                    </div>
                )}
            </main>
             <BottomNav currentStep={state.step} onNavigate={handleNavigation} canNavigate={canNavigate} />
        </div>
    );
};

const rootElement = document.getElementById('root');
if (rootElement) {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
        <React.StrictMode>
            <App />
        </React.StrictMode>
    );
}
