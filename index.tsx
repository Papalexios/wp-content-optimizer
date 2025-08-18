
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
 * A professional, state-of-the-art promise queue processor.
 * It executes a series of promise-returning functions sequentially with a delay,
 * preventing API rate-limiting issues and providing progress updates.
 * @param items The array of items to process.
 * @param promiseFn The function that takes an item and returns a promise.
 * @param onProgress Optional callback to report progress for each item.
 * @param delay The delay in ms between each promise execution.
 */
const processPromiseQueue = async (items, promiseFn, onProgress, delay = 1000) => {
    const results = [];
    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        try {
            const result = await promiseFn(item);
            results.push({ status: 'fulfilled', value: result });
            if (onProgress) onProgress({ item, result, index: i, success: true });
        } catch (error) {
            results.push({ status: 'rejected', reason: error });
            if (onProgress) onProgress({ item, error, index: i, success: false });
        }
        if (i < items.length - 1) {
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    return results;
};

const PROMOTIONAL_URLS = [
    "https://affiliatemarketingforsuccess.com/blog/", "https://affiliatemarketingforsuccess.com/seo/write-meta-descriptions-that-convert/", "https://affiliatemarketingforsuccess.com/blogging/winning-content-strategy/", "https://affiliatemarketingforsuccess.com/review/copy-ai-review/", "https://affiliatemarketingforsuccess.com/how-to-start/how-to-choose-a-web-host/", "https://affiliatemarketingforsuccess.com/ai/detect-ai-writing/", "https://affiliatemarketingforsuccess.com/affiliate-marketing/warriorplus-affiliate-program-unlock-lucrative-opportunities/", "https://affiliatemarketingforsuccess.com/affiliate-marketing/understanding-what-is-pay-per-call-affiliate-marketing/", "https://affiliatemarketingforsuccess.com/ai/how-chatbot-can-make-you-money/", "https://affiliatemarketingforsuccess.com/info/influencer-marketing-sales/", "https://affiliatemarketingforsuccess.com/ai/the-power-of-large-language-models/", "https://affiliatemarketingforsuccess.com/how-to-start/10-simple-steps-to-build-your-website-a-beginners-guide/", "https://affiliatemarketingforsuccess.com/blogging/sustainable-content/", "https://affiliatemarketingforsuccess.com/affiliate-marketing/best-discounts-on-black-friday/", "https://affiliatemarketingforsuccess.com/seo/website-architecture-that-drives-conversions/", "https://affiliatemarketingforsuccess.com/blogging/how-to-create-evergreen-content/", "https://affiliatemarketingforsuccess.com/email-marketing/email-marketing-benefits/", "https://affiliatemarketingforsuccess.com/blogging/promote-your-blog-to-increase-traffic/", "https://affiliatemarketingforsuccess.com/ai/discover-the-power-of-chatgpt/", "https://affiliatemarketingforsuccess.com/affiliate-marketing/affiliate-marketing-with-personalized-recommendations/", "https://affiliatemarketingforsuccess.com/seo/benefits-of-an-effective-seo-strategy/", "https://affiliatemarketingforsuccess.com/ai/what-is-ai-prompt-engineering/", "https://affiliatemarketingforsuccess.com/affiliate-marketing/successful-in-affiliate-marketing/", "https://affiliatemarketingforsuccess.com/affiliate-marketing/join-the-best-affiliate-networks/", "https://affiliatemarketingforsuccess.com/affiliate-marketing/beginners-guide-to-affiliate-marketing/", "https://affiliatemarketingforsuccess.com/affiliate-marketing/high-ticket-affiliate-marketing/", "https://affiliatemarketingforsuccess.com/affiliate-marketing/enhance-your-affiliate-marketing-content/", "https://affiliatemarketingforsuccess.com/affiliate-marketing/how-to-do-affiliate-marketing-on-shopify/", "https://affiliatemarketingforsuccess.com/affiliate-marketing/discover-why-affiliate-marketing-is-the-best-business-model/", "https://affiliatemarketingforsuccess.com/affiliate-marketing/how-affiliate-marketing-helps-you-to-become-an-influencer/", "https://affiliatemarketingforsuccess.com/affiliate-marketing/how-to-affiliate-marketing-on-blog/", "https://affiliatemarketingforsuccess.com/affiliate-marketing/affiliate-networks/", "https://affiliatemarketingforsuccess.com/affiliate-marketing/how-to-create-a-landing-page-for-affiliate-marketing/", "https://affiliatemarketingforsuccess.com/review/scalenut-review/", "https://affiliatemarketingforsuccess.com/seo/how-to-improve-your-content-marketing-strategy-in-2025/", "https://affiliatemarketingforsuccess.com/ai/startup-success-with-chatgpt/", "https://affiliatemarketingforsuccess.com/blogging/market-your-blog-the-right-way/", "https://affiliatemarketingforsuccess.com/ai/surfer-seo-alternatives/", "https://affiliatemarketingforsuccess.com/ai/avoid-ai-detection/", "https://affiliatemarketingforsuccess.com/seo/optimize-your-off-page-seo-strategy/", "https://affiliatemarketingforsuccess.com/ai/chatgpt-alternative/", "https://affiliatemarketingforsuccess.com/seo/build-an-effective-seo-strategy/", "https://affiliatemarketingforsuccess.com/email-marketing/understanding-email-marketing/", "https://affiliatemarketingforsuccess.com/ai/write-handwritten-assignments/", "https://affiliatemarketingforsuccess.com/ai/prompt-engineering-secrets/", "https://affiliatemarketingforsuccess.com/seo/boost-your-organic-ranking/", "https://affiliatemarketingforsuccess.com/seo/how-to-use-google-my-business-to-improve-your-blogs-local-seo/", "https://affiliatemarketingforsuccess.com/affiliate-marketing/affiliate-marketing-tips-for-beginners/", "https://affiliatemarketingforsuccess.com/ai/chatgpt-occupation-prompts/", "https://affiliatemarketingforsuccess.com/ai/perplexity-copilot/", "https://affiliatemarketingforsuccess.com/ai/agility-writer-vs-autoblogging-ai/", "https://affiliatemarketingforsuccess.com/ai/split-testing-perplexity-pages-affiliate-sales/", "https://affiliatemarketingforsuccess.com/ai/perplexity-ai-affiliate-funnels-automation/", "https://affiliatemarketingforsuccess.com/ai/ai-content-detectors-reliability/", "https://affiliatemarketingforsuccess.com/ai/google-bard-bypass-detection/", "https://affiliatemarketingforsuccess.com/ai/teachers-detect-gpt-4/", "https://affiliatemarketingforsuccess.com/ai/how-to-write-with-perplexity-ai/", "https://affiliatemarketingforsuccess.com/ai/turnitin-ai-detection-accuracy/", "https://affiliatemarketingforsuccess.com/ai/undetectable-ai-alternatives/", "https://affiliatemarketingforsuccess.com/ai/perplexity-jailbreak-prompts-2/", "https://affiliatemarketingforsuccess.com/affiliate-marketing/earn-generous-commissions-with-walmart-affiliate-program/", "https://affiliatemarketingforsuccess.com/affiliate-marketing/how-to-increase-your-affiliate-marketing-conversion-rate/", "https://affiliatemarketingforsuccess.com/ai/how-chat-gpt-will-change-education/", "https://affiliatemarketingforsuccess.com/email-marketing/getresponse-review-2025/", "https://affiliatemarketingforsuccess.com/affiliate-marketing/how-to-create-an-affiliate-marketing-strategy/", "https://affiliatemarketingforsuccess.com/ai/perplexity-model/", "https://affiliatemarketingforsuccess.com/email-marketing/proven-ways-to-grow-your-email-list/", "https://affiliatemarketingforsuccess.com/ai/undetectable-ai/", "https://affiliatemarketingforsuccess.com/review/use-fiverr-gigs-to-boost-your-business/", "https://affiliatemarketingforsuccess.com/seo/google-ranking-factors/", "https://affiliatemarketingforsuccess.com/ai/how-chat-gpt-is-different-from-google/", "https://affiliatemarketingforsuccess.com/blogging/a-guide-to-copyediting-vs-copywriting/", "https://affiliatemarketingforsuccess.com/email-marketing/craft-irresistible-email-newsletters/", "https://affiliatemarketingforsuccess.com/affiliate-marketing/affiliate-marketing-on-instagram/", "https://affiliatemarketingforsuccess.com/ai/integrate-perplexity-ai-affiliate-tech-stack/", "https://affiliatemarketingforsuccess.com/ai/affiliate-marketing-perplexity-ai-future/", "https://affiliatemarketingforsuccess.com/blogging/increase-domain-authority-quickly/", "https://affiliatemarketingforsuccess.com/review/wp-rocket-boost-wordpress-performance/", "https://affiliatemarketingforsuccess.com/affiliate-marketing/shein-affiliate-program-usa-fashionable-earnings-await-you/", "https://affiliatemarketingforsuccess.com/ai/auto-ai-transforming-industries-with-automation/", "https://affiliatemarketingforsuccess.com/ai/is-turnitin-free/", "https://affiliatemarketingforsuccess.com/review/getresponse-vs-clickfunnels/", "https://affiliatemarketingforsuccess.com/ai/autoblogging-ai-review/", "https://affiliatemarketingforsuccess.com/tools/affiliate-link-generator/", "https://affiliatemarketingforsuccess.com/ai/chatgpt-creative-writing-prompts/", "https://affiliatemarketingforsuccess.com/ai/undetectable-ai-review/", "https://affiliatemarketingforsuccess.com/ai/best-ai-detector/", "https://affiliatemarketingforsuccess.com/ai/ai-future-of-seo/", "https://affiliatemarketingforsuccess.com/review/clickfunnels-review/", "https://affiliatemarketingforsuccess.com/ai/chatgpt-plagiarize/", "https://affiliatemarketingforsuccess.com/ai/turnitin-detect-quillbot-paraphrasing/", "https://affiliatemarketingforsuccess.com/ai/use-turnitin-checker/", "https://affiliatemarketingforsuccess.com/ai/turnitin-read-images/", "https://affiliatemarketingforsuccess.com/ai/turnitin-ai-detection-free/", "https://affiliatemarketingforsuccess.com/ai/jobs-in-danger-due-to-gpt-4/", "https://affiliatemarketingforsuccess.com/ai/surfer-ai-review/", "https://affiliatemarketingforsuccess.com/tools/content-idea-generator/", "https://affiliatemarketingforsuccess.com/review/getresponse-vs-mailchimp/", "https://affiliatemarketingforsuccess.com/ai/turnitin-plagiarism/", "https://affiliatemarketingforsuccess.com/email-marketing/getresponse-vs-tinyemail/", "https://affiliatemarketingforsuccess.com/affiliate-marketing/struggling-with-wordpress/", "https://affiliatemarketingforsuccess.com/ai/learn-prompt-engineering/", "https://affiliatemarketingforsuccess.com/affiliate-marketing/how-to-promote-affiliate-products-without-a-website/", "https://affiliatemarketingforsuccess.com/ai/chatgpt-playground/", "https://affiliatemarketingforsuccess.com/ai/chatgpt-api/", "https://affiliatemarketingforsuccess.com/review/frase-review-2025/", "https://affiliatemarketingforsuccess.com/review/seowriting-ai-review/", "https://affiliatemarketingforsuccess.com/tools/seo-keyword-research-tool/", "https://affiliatemarketingforsuccess.com/tools/affiliate-program-comparison-tool/", "https://affiliatemarketingforsuccess.com/review/writesonic-review/", "https://affiliatemarketingforsuccess.com/blogging/content-marketing-must-educate-and-convert-the-customer/", "https://affiliatemarketingforsuccess.com/blogging/how-to-successfully-transition-into-copywriting/", "https://affiliatemarketingforsuccess.com/blogging/how-to-use-new-methods-to-capture-leads/", "https://affiliatemarketingforsuccess.com/blogging/update-old-blog-content/", "https://affiliatemarketingforsuccess.com/review/frase-io-vs-quillbot/", "https://affiliatemarketingforsuccess.com/blogging/testimonials-as-blog-content-in-2024/", "https://affiliatemarketingforsuccess.com/blogging/overcoming-blog-stagnation/", "https://affiliatemarketingforsuccess.com/seo/web-positioning-in-google/", "https://affiliatemarketingforsuccess.com/blogging/the-blogging-lifestyle/", "https://affiliatemarketingforsuccess.com/review/bramework-review/", "https://affiliatemarketingforsuccess.com/seo/how-will-voice-search-impact-your-seo-strategy/", "https://affiliatemarketingforsuccess.com/how-to-start/how-to-succeed-in-email-marketing/", "https://affiliatemarketingforsuccess.com/review/spreadsimple-review/", "https://affiliatemarketingforsuccess.com/ai/boost-affiliate-earnings-perplexity-ai/", "https://affiliatemarketingforsuccess.com/tools/script-timer-tool/", "https://affiliatemarketingforsuccess.com/ai/agility-writer-review/", "https://affiliatemarketingforsuccess.com/review/inkforall-review-2024/", "https://affiliatemarketingforsuccess.com/web-hosting/web-hosting-comparison/", "https://affiliatemarketingforsuccess.com/ai/is-chatgpt-down-what-happened-and-how-to-fix-it/", "https://affiliatemarketingforsuccess.com/review/namehero-hosting-review/", "https://affiliatemarketingforsuccess.com/review/katteb-review/", "https://affiliatemarketingforsuccess.com/blogging/wordpress-blogging-tips/", "https://affiliatemarketingforsuccess.com/review/neuronwriter-review/", "https://affiliatemarketingforsuccess.com/affiliate-marketing/how-quickly-can-i-make-money-with-affiliate-marketing/", "https://affiliatemarketingforsuccess.com/affiliate-marketing/step-by-step-in-affiliate-marketing/", "https://affiliatemarketingforsuccess.com/affiliate-marketing/the-costs-to-start-affiliate-marketing/", "https://affiliatemarketingforsuccess.com/blogging/grow-your-affiliate-marketing-blog/", "https://affiliatemarketingforsuccess.com/affiliate-marketing/affiliate-niche-selection-mistakes/", "https://affiliatemarketingforsuccess.com/affiliate-marketing/affiliate-marketing-reviews/", "https://affiliatemarketingforsuccess.com/affiliate-marketing/affiliate-marketing-tools/", "https://affiliatemarketingforsuccess.com/affiliate-marketing/digital-marketing-definition/", "https://affiliatemarketingforsuccess.com/affiliate-marketing/build-an-affiliate-marketing-business/", "https://affiliatemarketingforsuccess.com/affiliate-marketing/affiliate-marketing-success/", "https://affiliatemarketingforsuccess.com/affiliate-marketing/best-ai-affiliate-niches/", "https://affiliatemarketingforsuccess.com/affiliate-marketing/the-concepts-of-digital-marketing/", "https://affiliatemarketingforsuccess.com/affiliate-marketing/building-an-affiliate-marketing-website/", "https://affiliatemarketingforsuccess.com/affiliate-marketing/how-affiliate-marketing-works/", "https://affiliatemarketingforsuccess.com/affiliate-marketing/maximize-your-startup-potential-leverage-chatgpt-for-startups-with-expert-chatgpt-prompts/", "https://affiliatemarketingforsuccess.com/review/grammarly-premium-review-leveradge-your-writing/", "https://affiliatemarketingforsuccess.com/blogging/how-to-position-your-blog/", "https://affiliatemarketingforsuccess.com/blogging/how-to-quickly-generate-leads/", "https://affiliatemarketingforsuccess.com/blogging/what-is-the-best-structure-of-a-blog-post/", "https://affiliatemarketingforsuccess.com/ai/chatgpt-has-changed-seo-forever/", "https://affiliatemarketingforsuccess.com/blogging/8-tips-for-successful-copywriting/", "https://affiliatemarketingforsuccess.com/blogging/why-do-blogs-fail/", "https://affiliatemarketingforsuccess.com/ai/copywriting-frameworks/", "https://affiliatemarketingforsuccess.com/affiliate-marketing/how-long-it-takes-to-become-an-affiliate-marketer/", "https://affiliatemarketingforsuccess.com/make-money-online/business-models-to-make-money-online/", "https://affiliatemarketingforsuccess.com/review/blogify-ai-review/", "https://affiliatemarketingforsuccess.com/review/wpx-hosting-review/", "https://affiliatemarketingforsuccess.com/affiliate-marketing/affiliate-marketing-for-online-business/", "https://affiliatemarketingforsuccess.com/review/kinsta-wordpress-hosting-review/", "https://affiliatemarketingforsuccess.com/review/marketmuse-review/", "https://affiliatemarketingforsuccess.com/blogging/how-to-analyze-your-blogs-user-behavior-metrics/", "https://affiliatemarketingforsuccess.com/ai/prompt-engineering-examples/", "https://affiliatemarketingforsuccess.com/blogging/how-to-increase-your-online-sales-at-christmas/", "https://affiliatemarketingforsuccess.com/blogging/keys-to-creating-successful-content-on-your-blog/", "https://affiliatemarketingforsuccess.com/review/writesonic-vs-seowriting-ai/", "https://affiliatemarketingforsuccess.com/ai/perplexity-ai-revolutionize-affiliate-strategy/", "https://affiliatemarketingforsuccess.com/ai/perplexity-ai-affiliate-marketing/", "https://affiliatemarketingforsuccess.com/blogging/create-seo-friendly-blog-posts/", "https://affiliatemarketingforsuccess.com/ai/chatgpt-for-education/", "https://affiliatemarketingforsuccess.com/make-money-online/what-is-the-profile-of-a-successful-online-entrepreneur/", "https://affiliatemarketingforsuccess.com/ai/bard-vs-chatgpt-vs-grok/", "https://affiliatemarketingforsuccess.com/blogging/automate-your-blog-with-artificial-intelligence/", "https://affiliatemarketingforsuccess.com/info/how-to-screenshot-on-chromebook/", "https://affiliatemarketingforsuccess.com/ai/chatgpt-detected-by-safeassign/", "https://affiliatemarketingforsuccess.com/ai/turnitin-vs-grammarly/", "https://affiliatemarketingforsuccess.com/affiliate-marketing/what-are-impressions-in-advertising/", "https://affiliatemarketingforsuccess.com/blogging/11-things-to-outsource-as-a-blogger-for-more-time-and-efficiency/", "https://affiliatemarketingforsuccess.com/email-marketing/email-list-for-affiliate-marketing/", "https://affiliatemarketingforsuccess.com/review/copy-ai-vs-katteb/", "https://affiliatemarketingforsuccess.com/how-to-start/google-ranking-factors-seo-strategy/", "https://affiliatemarketingforsuccess.com/make-money-online/how-to-make-money-writing-articles-online/", "https://affiliatemarketingforsuccess.com/blogging/best-topics-on-your-digital-marketing-blog/", "https://affiliatemarketingforsuccess.com/web-hosting/digitalocean-review/", "https://affiliatemarketingforsuccess.com/blogging/top-challenges-a-blogger-faces/", "https://affiliatemarketingforsuccess.com/blogging/how-to-boost-the-ranking-of-an-existing-page-on-search-engines/", "https://affiliatemarketingforsuccess.com/blogging/create-your-personal-blog/", "https://affiliatemarketingforsuccess.com/ai/chatgpt-vs-competing-language-models/", "https://affiliatemarketingforsuccess.com/info/paraphrase-text-using-nlp/", "https://affiliatemarketingforsuccess.com/review/pictory-ai-review/", "https://affiliatemarketingforsuccess.com/affiliate-marketing/how-to-track-and-measure-your-affiliate-marketing-performance/", "https://affiliatemarketingforsuccess.com/affiliate-marketing/how-to-use-seo-for-affiliate-marketing/", "https://affiliatemarketingforsuccess.com/seo/mastering-seo-best-practices/", "https://affiliatemarketingforsuccess.com/affiliate-marketing/how-much-time-it-takes-to-earn-from-affiliate-marketing/", "https://affiliatemarketingforsuccess.com/blogging/google-pagespeed-insights/", "https://affiliatemarketingforsuccess.com/blogging/the-imposter-syndrome/", "https://affiliatemarketingforsuccess.com/blogging/lead-nurturing/", "https://affiliatemarketingforsuccess.com/affiliate-marketing/affiliate-marketing-vs-dropshipping/", "https://affiliatemarketingforsuccess.com/affiliate-marketing/how-to-make-money-with-affiliate-marketing/", "https://affiliatemarketingforsuccess.com/seo/the-importance-of-seo-for-your-blog/", "https://affiliatemarketingforsuccess.com/how-to-start/criteria-for-profitable-affiliate-niches/", "https://affiliatemarketingforsuccess.com/ai/chatgpt-give-same-answers/", "https://affiliatemarketingforsuccess.com/affiliate-marketing/why-affiliate-marketers-fail/", "https://affiliatemarketingforsuccess.com/ai/winston-detect-quillbot/", "https://affiliatemarketingforsuccess.com/ai/quillbot-bypass-ai-detection/", "https://affiliatemarketingforsuccess.com/ai/how-chatgpt-gets-information/", "https://affiliatemarketingforsuccess.com/email-marketing/effective-email-marketing-strategies/", "https://affiliatemarketingforsuccess.com/ai/semantic-clustering-in-seo/", "https://affiliatemarketingforsuccess.com/ai/semantic-clustering-tools/", "https://affiliatemarketingforsuccess.com/blogging/how-to-write-niche-specific-content/", "https://affiliatemarketingforsuccess.com/make-money-online/optimize-your-sales-funnel/", "https://affiliatemarketingforsuccess.com/affiliate-marketing/best-affiliate-marketing-niches-2025/", "https://affiliatemarketingforsuccess.com/affiliate-marketing/how-to-start-an-affiliate-marketing-blog/", "https://affiliatemarketingforsuccess.com/blogging/how-to-setup-the-basic-seo-technical-foundations-for-your-blog/", "https://affiliatemarketingforsuccess.com/blogging/long-term-content-strategy/", "https://affiliatemarketingforsuccess.com/ai/how-chatgpt-works/", "https://affiliatemarketingforsuccess.com/ai/prompt-engineering-nlp/", "https://affiliatemarketingforsuccess.com/ai/prompt-engineering-course/", "https://affiliatemarketingforsuccess.com/ai/prompt-engineering-ai-art/", "https://affiliatemarketingforsuccess.com/review/semrush-review-2025/", "https://affiliatemarketingforsuccess.com/affiliate-marketing/top-10-affiliate-marketing-trends-in-2025/", "https://affiliatemarketingforsuccess.com/affiliate-marketing/launch-affiliate-business-ai-tools/", "https://affiliatemarketingforsuccess.com/blogging/monetize-your-blog-proven-strategies/", "https://affiliatemarketingforsuccess.com/ai/ethical-implications-of-ai/", "https://affiliatemarketingforsuccess.com/web-hosting/siteground-web-hosting-review-2025/", "https://affiliatemarketingforsuccess.com/ai/deepseek-r1-vs-chatgpt/", "https://affiliatemarketingforsuccess.com/ai/prompt-engineering-jobs/", "https://affiliatemarketingforsuccess.com/ai/perplexity-ai/", "https://affiliatemarketingforsuccess.com/review/the-ultimate-jasper-ai-review/", "https://affiliatemarketingforsuccess.com/affiliate-marketing/how-to-use-social-media-for-affiliate-marketing/", "https://affiliatemarketingforsuccess.com/ai/chatgpt-use-cases/", "https://affiliatemarketingforsuccess.com/seo/the-importance-of-keywords-research/", "https://affiliatemarketingforsuccess.com/ai/ai-prompt-writing/", "https://affiliatemarketingforsuccess.com/blogging/what-is-copywriting-promotes-advertises-or-entertains/", "https://affiliatemarketingforsuccess.com/blogging/how-to-write-a-high-ranking-blog-post/", "https://affiliatemarketingforsuccess.com/affiliate-marketing/generative-ai/", "https://affiliatemarketingforsuccess.com/how-to-start/how-to-register-a-domain-name/", "https://affiliatemarketingforsuccess.com/chatgpt-prompts/chatgpt-prompts-for-marketing/", "https://affiliatemarketingforsuccess.com/affiliate-marketing/how-many-affiliate-programs-should-i-join-guide/", "https://affiliatemarketingforsuccess.com/how-to-start/top-10-pro-tips-for-choosing-affiliate-marketing-programs/", "https://affiliatemarketingforsuccess.com/affiliate-marketing/optimize-your-affiliate-marketing-website-for-seo/", "https://affiliatemarketingforsuccess.com/affiliate-marketing/how-to-use-youtube-for-affiliate-marketing/", "https://affiliatemarketingforsuccess.com/ai/ai-affiliate-marketing-strategies-2025/", "https://affiliatemarketingforsuccess.com/review/quillbot-review/", "https://affiliatemarketingforsuccess.com/how-to-start/how-to-choose-your-niche/", "https://affiliatemarketingforsuccess.com/affiliate-marketing/how-to-make-money-with-amazon-affiliate-marketing/", "https://affiliatemarketingforsuccess.com/ai/best-chatgpt-alternatives-for-2025/", "https://affiliatemarketingforsuccess.com/how-to-start/most-suitable-affiliate-program/", "https://affiliatemarketingforsuccess.com/seo/seo-writing-a-complete-guide-to-seo-writing/", "https://affiliatemarketingforsuccess.com/how-to-start/the-truth-about-web-hosting/", "https://affiliatemarketingforsuccess.com/ai/chatgpt-prompt-engineering/", "https://affiliatemarketingforsuccess.com/blogging/storytelling-in-content-marketing/", "https://affiliatemarketingforsuccess.com/tools/email-marketing-template-generator/", "https://affiliatemarketingforsuccess.com/affiliate-marketing/affiliate-marketing-mistakes/", "https://affiliatemarketingforsuccess.com/seo/keyword-stemming/", "https://affiliatemarketingforsuccess.com/ai/multimodal-ai-models-guide/", "https://affiliatemarketingforsuccess.com/ai/large-language-models-comparison-2025/", "https://affiliatemarketingforsuccess.com/ai/gpt-4o-vs-gemini/", "https://affiliatemarketingforsuccess.com/ai/multimodal-prompt-engineering/", "https://affiliatemarketingforsuccess.com/ai/claude-4-guide/", "https://affiliatemarketingforsuccess.com/seo/programmatic-seo/", "https://affiliatemarketingforsuccess.com/blogging/blogging-mistakes-marketers-make/", "https://affiliatemarketingforsuccess.com/seo/why-your-current-seo-strategy-is-failing/", "https://affiliatemarketingforsuccess.com/blogging/how-to-brand-storytelling/", "https://affiliatemarketingforsuccess.com/seo/doing-an-seo-audit/", "https://affiliatemarketingforsuccess.com/tools/commission-calculator/", "https://affiliatemarketingforsuccess.com/blogging/essential-tools-for-a-blogger/", "https://affiliatemarketingforsuccess.com/blogging/types-of-evergreen-content/", "https://affiliatemarketingforsuccess.com/affiliate-marketing/affiliate-marketing-strategies/", "https://affiliatemarketingforsuccess.com/review/cloudways-review-2025/", "https://affiliatemarketingforsuccess.com/affiliate-marketing/the-power-of-ai-in-seo/", "https://affiliatemarketingforsuccess.com/ai/artificial-intelligence-machine-learning-revolutionizing-the-future/", "https://affiliatemarketingforsuccess.com/affiliate-marketing/keys-to-successful-affiliate-marketing/", "https://affiliatemarketingforsuccess.com/seo/improve-your-ranking-in-seo/", "https://affiliatemarketingforsuccess.com/blogging/reduce-bounce-rate/", "https://affiliatemarketingforsuccess.com/blogging/what-is-a-creative-copywriter/", "https://affiliatemarketingforsuccess.com/ai/chatgpt4-vs-gemini-pro-in-blog-writing/", "https://affiliatemarketingforsuccess.com/blogging/build-a-blogging-business-from-scratch/", "https://affiliatemarketingforsuccess.com/affiliate-marketing/the-ultimate-guide-to-affiliate-marketing/", "https://affiliatemarketingforsuccess.com/email-marketing/convertkit-pricing/", "https://affiliatemarketingforsuccess.com/affiliate-marketing/best-affiliate-products-to-promote/", "https://affiliatemarketingforsuccess.com/make-money-online/how-to-make-money-with-clickbank-the-ultimate-guide/", "https://affiliatemarketingforsuccess.com/seo/link-building-strategies/", "https://affiliatemarketingforsuccess.com/affiliate-marketing/affiliate-marketing-on-pinterest/", "https://affiliatemarketingforsuccess.com/blogging/blog-monetization-strategies/", "https://affiliatemarketingforsuccess.com/affiliate-marketing/why-is-affiliate-marketing-so-hard/", "https://affiliatemarketingforsuccess.com/ai/originality-ai-review/", "https://affiliatemarketingforsuccess.com/ai/how-chatbot-helps-developers/", "https://affiliatemarketingforsuccess.com/info/how-to-make-a-social-media-marketing-plan/", "https://affiliatemarketingforsuccess.com/blogging/countless-benefits-of-blogging/", "https://affiliatemarketingforsuccess.com/ai/the-anthropic-prompt-engineer/", "https://affiliatemarketingforsuccess.com/ai/nvidia-ai/", "https://affiliatemarketingforsuccess.com/chatgpt-prompts/awesome-chatgpt-prompts/", "https://affiliatemarketingforsuccess.com/ai/ai-powered-semantic-clustering/", "https://affiliatemarketingforsuccess.com/ai/semantic-clustering-techniques/", "https://affiliatemarketingforsuccess.com/ai/benefits-of-semantic-clustering/"
];


const ProgressBar = ({ currentStep }: { currentStep: number }) => {
    const steps = ['Config', 'Content', 'Review & Publish'];
    return (
        <div className="progress-bar-container">
            <h2 className="mobile-step-title">Step {currentStep}: {steps[currentStep - 1]}</h2>
            <ol className="progress-bar">
                {steps.map((name, index) => {
                    const stepIndex = index + 1;
                    const status = stepIndex < currentStep ? 'completed' : stepIndex === currentStep ? 'active' : '';
                    return (
                        <li key={name} className={`progress-step ${status}`}>
                            <div className="step-circle">{stepIndex < currentStep ? '✔' : stepIndex}</div>
                            <div className="step-name">{name}</div>
                        </li>
                    );
                })}
            </ol>
        </div>
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

        return (
            <div className={`connection-status ${wpConnectionStatus}`}>
                {wpConnectionStatus === 'verifying' && <p>Verifying connection...</p>}
                {wpConnectionStatus === 'error' && <p><strong>Connection Failed:</strong> {wpConnectionError}</p>}
                {wpConnectionStatus === 'success' && (
                    <>
                        <p>✅ <strong>Connection successful.</strong> Role(s): {wpUserRoles.join(', ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                        {isLowPermissionRole && (
                            <p className="role-warning">
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
                    <p className="help-text">Generate this in your WP admin under Users &gt; Profile &gt; Application Passwords. This password is never stored.</p>
                </div>
                <div className="form-group">
                    <button onClick={onVerifyWpConnection} className="btn" style={{backgroundColor: '#4B5563', width: 'auto'}} disabled={loading.wpConnection || !isWpConfigured}>
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
            {saveConfig && <button onClick={handleClearConfig} className="btn" style={{backgroundColor: '#4B5563', marginTop: '1rem', width: 'auto'}}>Clear Saved Config</button>}
            <div className="button-group" style={{marginTop: '1.5rem'}}>
                <button onClick={() => onFetchSitemap(false)} className="btn" style={{backgroundColor: '#4B5563'}} disabled={loading.sitemap || !isApiKeyValid || wpConnectionStatus !== 'success'}>
                    Proceed without Sitemap
                </button>
                <button onClick={() => onFetchSitemap(true)} className="btn" disabled={loading.sitemap || !isSitemapConfigValid || !isApiKeyValid || wpConnectionStatus !== 'success'}>
                    {loading.sitemap ? 'Fetching...' : 'Fetch Sitemap & Proceed'}
                </button>
            </div>
        </div>
    );
};

const ContentStep = ({ state, dispatch, onGenerateContent, onFetchWpPosts, onAnalyzeAndSelect, onGeneratePostIdeas }) => {
    const { rawContent, loading, wpPosts, postToUpdate, wpConnectionStatus, postIdeas } = state;
    const [activeView, setActiveView] = useState('welcome'); // 'welcome', 'new', 'edit'
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'modified', direction: 'ascending' });
    const [hideUpdated, setHideUpdated] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        if (postToUpdate) {
            setActiveView('edit');
        }
    }, [postToUpdate]);
    
    const handleCreateNewClick = () => {
        dispatch({ type: 'CLEAR_UPDATE_SELECTION' });
        setActiveView('new');
        setIsSidebarOpen(false);
    };

    const handlePostRowClick = (post) => {
        if (!post.canEdit || post.status === 'loading' || post.id === postToUpdate) return;
        onAnalyzeAndSelect(post);
        setIsSidebarOpen(false);
    };
    
    const getPostStatus = (post) => {
        if (!post.canEdit) return { icon: '🔒', sort: 4, label: 'Locked' };
        if (post.id === postToUpdate) return { icon: '✏️', sort: 0, label: 'Editing' };
        if (post.updatedInSession) return { icon: '✅', sort: 2, label: 'Updated' };
        return { icon: '📝', sort: 1, label: 'Not Touched' };
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
        if (sortConfig.key !== key) return null;
        return sortConfig.direction === 'ascending' ? '🔼' : '🔽';
    };
    
    const renderWelcomeView = () => (
        <div className="workspace-welcome">
            <div className="icon">✍️</div>
            <h3>Content Hub</h3>
            <p>Ready to create? Start a brand new article or select an existing post to begin optimizing.</p>
        </div>
    );
    
    const renderNewPostView = () => (
         <>
            <div className="post-ideas-generator">
                <h4>Need inspiration?</h4>
                <p className="help-text">Generate AI-powered blog post ideas based on your site's content to fill gaps and boost topical authority.</p>
                <button
                    onClick={onGeneratePostIdeas}
                    className="btn"
                    disabled={loading.ideas}
                    style={{ width: 'auto', marginBottom: '1.5rem' }}
                >
                    {loading.ideas ? 'Generating Ideas...' : '✨ Generate 5 Post Ideas'}
                </button>
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
                <button onClick={() => dispatch({type: 'SET_STEP', payload: 1})} className="btn" style={{backgroundColor: '#4B5563'}}>Back to Config</button>
                <button onClick={onGenerateContent} className="btn" disabled={loading.content || !rawContent}>
                    {loading.content ? 'Generating...' : 'Optimize New Content'}
                </button>
            </div>
        </>
    );

    const renderEditPostView = () => (
        <>
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
                <button onClick={() => dispatch({type: 'SET_STEP', payload: 1})} className="btn" style={{backgroundColor: '#4B5563'}}>Back to Config</button>
                <button onClick={onGenerateContent} className="btn" disabled={loading.content || !rawContent}>
                    {loading.content ? 'Generating...' : 'Optimize Existing Content'}
                </button>
            </div>
        </>
    );

    return (
        <div className="step-container content-hub-layout" id="step-2-content">
            <div className={`sidebar-backdrop ${isSidebarOpen ? 'is-open' : ''}`} onClick={() => setIsSidebarOpen(false)}></div>
            <aside className={`content-hub-sidebar ${isSidebarOpen ? 'is-open' : ''}`}>
                <div className="sidebar-header">
                     <button className="sidebar-close-btn" onClick={() => setIsSidebarOpen(false)} aria-label="Close post list">&times;</button>
                     <button onClick={handleCreateNewClick} className="btn" style={{marginBottom: '1.5rem'}}>
                        + Create New Post
                    </button>
                    
                    {wpConnectionStatus !== 'success' ? (
                         <div className="warning-box" style={{margin: '0 0 1rem 0'}}>
                            <p>Verify WordPress connection in Step 1 to manage existing posts.</p>
                        </div>
                    ) : wpPosts.length === 0 ? (
                        <button onClick={onFetchWpPosts} className="btn" disabled={loading.posts}>
                            {loading.posts ? 'Loading Posts...' : 'Load Published Posts'}
                        </button>
                    ) : (
                        <div className="sidebar-controls">
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
                        </div>
                    )}
                </div>
                <div className="posts-list-container">
                    <table className="posts-table">
                        <thead>
                            <tr>
                                <th onClick={() => requestSort('status')} className={sortConfig.key === 'status' ? 'active' : ''}>
                                    <span title="Status">St</span>
                                    <span className="sort-indicator">{getSortIndicator('status')}</span>
                                </th>
                                <th onClick={() => requestSort('title')} className={sortConfig.key === 'title' ? 'active' : ''}>
                                    Post Title
                                    <span className="sort-indicator">{getSortIndicator('title')}</span>
                                </th>
                                <th onClick={() => requestSort('keyword')} className={sortConfig.key === 'keyword' ? 'active' : ''}>
                                    Keyword
                                    <span className="sort-indicator">{getSortIndicator('keyword')}</span>
                                </th>
                                <th onClick={() => requestSort('modified')} className={sortConfig.key === 'modified' ? 'active' : ''}>
                                    Last Mod.
                                    <span className="sort-indicator">{getSortIndicator('modified')}</span>
                                </th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedAndFilteredPosts.map(post => {
                                const { icon, label } = getPostStatus(post);
                                const classNames = [
                                    post.id === postToUpdate ? 'selected' : '',
                                    !post.canEdit ? 'cannot-edit' : '',
                                    post.updatedInSession ? 'updated-in-session' : '',
                                ].filter(Boolean).join(' ');

                                return (
                                    <tr 
                                        key={post.id} 
                                        className={classNames}
                                        onClick={() => handlePostRowClick(post)}
                                        style={{cursor: !post.canEdit ? 'not-allowed' : 'pointer'}}
                                    >
                                        <td className="status-cell" title={label}>{icon}</td>
                                        <td className="title-cell" title={post.title.rendered}>{post.title.rendered}</td>
                                        <td className="keyword-cell" title={post.keyword}>
                                            {post.status === 'loading' ? <div className="keyword-loading-spinner"></div> : post.keyword}
                                        </td>
                                        <td>{new Date(post.modified).toLocaleDateString()}</td>
                                        <td>
                                            <button 
                                                className="btn btn-small"
                                                disabled={post.status === 'loading' || !post.canEdit}
                                                onClick={(e) => { e.stopPropagation(); handlePostRowClick(post); }}
                                            >
                                                {post.id === postToUpdate ? 'Editing' : (post.status === 'loading' ? '...' : 'Select')}
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </aside>
            <main className="content-hub-workspace">
                 <button className="mobile-sidebar-trigger" onClick={() => setIsSidebarOpen(true)}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                    </svg>
                    Manage Posts
                </button>
                {activeView === 'welcome' && renderWelcomeView()}
                {activeView === 'new' && renderNewPostView()}
                {activeView === 'edit' && renderEditPostView()}
            </main>
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
            {duplicateInfo.similarUrl && publishMode === 'update' && !hasPublished && (
                 <div className="warning-box">
                    <h4>⚠️ Updating Existing Post</h4>
                    <p>You are about to update an existing article. The new content below will replace the current version on your website.</p>
                    <p><strong>Existing Article:</strong> <a href={duplicateInfo.similarUrl} target="_blank" rel="noopener noreferrer">{duplicateInfo.similarUrl}</a></p>
                </div>
            )}
            
            <div className="review-tabs">
                <button 
                    className={`tab-btn ${activeTab === 'editor' ? 'active' : ''}`}
                    onClick={() => setActiveTab('editor')}>
                    Editor
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'preview' ? 'active' : ''}`}
                    onClick={() => setActiveTab('preview')}>
                    Preview
                </button>
            </div>

            <div className="review-layout">
                <div className={`review-panel editor-panel ${activeTab !== 'editor' ? 'is-mobile-hidden' : ''}`}>
                    <h3>Editor</h3>
                    <div className="review-panel-content">
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
                                {infographics.map((info) => (
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
                                                <pre className="infographic-card-data">{info.data}</pre>
                                                <CopyButton textToCopy={info.data} />
                                            </div>
                                        </details>
                                    </div>
                                ))}
                            </div>
                        )}

                         <div className="form-group" style={{marginTop: '1.5rem'}}>
                            <div className="label-wrapper">
                                <label htmlFor="finalContent">Generated HTML Content</label>
                                <CopyButton textToCopy={finalContent} />
                            </div>
                            <textarea id="finalContent" value={finalContent} onChange={e => setField('finalContent', e.target.value)} style={{minHeight: '300px', fontFamily: 'monospace'}}></textarea>
                        </div>
                    </div>
                </div>
                <div className={`review-panel preview-panel ${activeTab !== 'preview' ? 'is-mobile-hidden' : ''}`}>
                    <h3>Live Preview</h3>
                    <div className="review-panel-content live-preview" dangerouslySetInnerHTML={{ __html: renderedContent }} />
                </div>
            </div>

            {hasPublished ? (
                <div className="post-publish-actions">
                    <h3>What's next?</h3>
                    <div className="button-group">
                        <button onClick={() => dispatch({type: 'RESET_FOR_NEW_POST'})} className="btn">
                            Create/Update Another Post
                        </button>
                        <button onClick={() => dispatch({type: 'SET_STEP', payload: 1})} className="btn" style={{backgroundColor: '#4B5563'}}>
                            Start Over (New Config)
                        </button>
                    </div>
                </div>
            ) : (
                <div className="button-group" style={{maxWidth: '1200px', margin: '2rem auto 0'}}>
                    <button onClick={() => dispatch({type: 'SET_STEP', payload: 2})} className="btn" style={{backgroundColor: '#4B5563'}}>Back to Content</button>
                    <button onClick={() => onPostAction(publishMode)} className="btn" disabled={loading.publish}>
                        {loading.publish 
                            ? (publishMode === 'update' ? 'Updating...' : 'Publishing...')
                            : (publishMode === 'update' ? 'Update Existing Post' : 'Publish to WordPress')
                        }
                    </button>
                </div>
            )}
        </div>
    );
};

const initialState = {
    step: 1,
    loading: { sitemap: false, content: false, publish: false, featuredImage: false, posts: false, ideas: false, wpConnection: false },
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
    wpPosts: [], // { id, title, link, date, modified, keyword, content, status, updatedInSession, canEdit }
    postToUpdate: null, // number | null
    postIdeas: [],
    wpConnectionStatus: 'idle', // idle, verifying, success, error
    wpConnectionError: '',
    wpUserRoles: [],
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
                wpConnectionStatus: 'idle', wpConnectionError: '', wpUserRoles: [],
            };
        case 'UPDATE_FIELD':
            const newState = { ...state, [action.payload.field]: action.payload.value };
            if (['wpUrl', 'wpUser', 'wpPassword'].includes(action.payload.field)) {
                newState.wpConnectionStatus = 'idle';
                newState.wpConnectionError = '';
                newState.wpUserRoles = [];
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
                wpPosts: state.wpPosts.map(p => p.id === action.payload.id ? { ...p, keyword: action.payload.keyword, status: 'done' } : p),
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
        case 'SET_WP_CONNECTION_STATUS':
            return { 
                ...state, 
                wpConnectionStatus: action.payload.status,
                wpConnectionError: action.payload.error || '',
                wpUserRoles: action.payload.roles || state.wpUserRoles
            };
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
        tags, categories, featuredImage, infographics, metaDescription
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
            
            addLog(`✅ Connection successful. Logged in as ${data.name}.`);
            dispatch({ type: 'SET_WP_CONNECTION_STATUS', payload: { status: 'success', roles: data.roles } });

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
            posts.sort((a, b) => new Date(a.modified).getTime() - new Date(b.modified).getTime());
            const postsWithStatus = posts.map(p => ({ ...p, status: 'idle', keyword: '', updatedInSession: false }));
            dispatch({ type: 'SET_WP_POSTS', payload: postsWithStatus });
            addLog(`✅ Found ${posts.length} published posts. Sorted by oldest first.`);
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
                payload: { id: post.id, link: post.link, keyword, content: contentHtml }
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
        dispatch({ type: 'SET_LOADING_STATE', payload: { ideas: true } });
        addLog('🤖 Generating post ideas to boost topical authority...');

        try {
            const apiKey = apiKeys[aiProvider];
            if (!apiKey) throw new Error(`${aiProvider.charAt(0).toUpperCase() + aiProvider.slice(1)} API Key is required for this feature.`);

            const prompt = `You are a world-class SEO strategist and content planner with deep expertise in establishing topical authority for websites.

Your task is to analyze the following list of URLs, which represent the content library of affiliatemarketingforsuccess.com. Based on this analysis, generate 5 high-quality blog post ideas that will strategically fill content gaps and bridge existing topics to significantly boost the site's topical authority and organic rankings.

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
${PROMOTIONAL_URLS.join('\n')}
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
    }, [aiProvider, apiKeys, openRouterModel, addLog]);
    
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

    const handleGenerateContent = useCallback(async () => {
        dispatch({ type: 'CLEAR_LOGS' });
        dispatch({ type: 'SET_LOADING_STATE', payload: { content: true, featuredImage: false } });

        const isUpdate = state.postToUpdate !== null;
        const logMessage = isUpdate ? `🤖 Updating existing post. Contacting ${aiProvider}...` : `🤖 Contacting ${aiProvider} for content strategy...`;
        addLog(logMessage);

        try {
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

            const systemInstruction = `You are "The Optimizer," a world-class SEO content strategist embodying the style of Alex Hormozi. Your directive is to transform raw text into a ~1500-word, SEO-dominant blog post. Your core principles are extreme value, brutal honesty, and actionable frameworks. You don't write fluff; you deliver dense, high-impact content that solves problems. Every sentence must serve a purpose. Your mission is to create content so valuable that it becomes the definitive resource on the topic, ensuring it outranks all competitors. You are an expert at analyzing search results to find and exploit content gaps. Failure to follow all instructions, especially the JSON format, is not an option.`;

            const basePrompt = `
${updateInstructions}

# STRATEGIC EXECUTION
You will perform the following sequence:
1.  **Deconstruct Input:** Identify the primary keyword and user intent from the "Raw Text".
2.  **SERP & Gap Analysis (Use Search Grounding):**
    *   Analyze the top 5 Google results for the primary keyword.
    *   Identify ALL "People Also Ask" (PAA) questions.
    *   **CRITICAL:** Pinpoint the content gaps. What are competitors NOT covering? What questions are they answering poorly? Your entire article will be built around filling these gaps to create a superior resource.
3.  **Content Generation:**
    *   **Write a ~1500-word article** that is deeply helpful, easy to read, and optimized for search.
    *   **Structure:** Use clear headings (H2, H3), lists, and bold text for scannability.
    *   **Integrate Keywords:** Naturally weave the primary keyword and related semantic keywords throughout.
    *   **Internal Linking:** Insert 6-10 contextually relevant internal links from the provided "Website URLs" within the article body (never in headings).
    *   **External Linking:** Include a "References" section with 8-12 links to high-authority EXTERNAL sites.
4.  **JSON Formatting:** Structure your complete output according to the "JSON OUTPUT FORMAT" specified below. This is a non-negotiable final step.

# REQUIRED CONTENT STRUCTURE (IN HTML):
1.  **Introduction**: A captivating, Hormozi-style hook that challenges a common belief or presents a startling fact. Must be 3-4 sentences.
2.  **Key Takeaways**: An \`<h3>\` titled "Key Takeaways" inside a \`<div class="key-takeaways">\`. Provide a bulleted list (\`<ul>\`) of the 3 most powerful, actionable points from the article.
3.  **Main Content Body**: The ~1500-word article, perfectly structured with \`<h2>\`, \`<h3>\`, \`<h4>\`, \`<p>\`, \`<ul>\`, \`<ol>\`, and \`<strong>\` tags. This section must cover all aspects identified in your analysis, including PAA and content gaps.
4.  **Infographics & Image Prompts**: Identify 3-4 key concepts that can be visualized. Insert unique HTML comment placeholders (\`<!-- INFOGRAPHIC-PLACEHOLDER-{UUID} -->\`) where they should appear and create corresponding blueprints in the JSON.
5.  **Conclusion**: A strong, summarizing conclusion that provides a clear call to action or a final powerful takeaway for the reader.
6.  **References Section**: An \`<h3>\` titled "References" inside a \`<div class="references-section">\`. Provide an unordered list (\`<ul>\`) of 8-12 hyperlinks. **NON-NEGOTIABLE REQUIREMENT - CRITICAL FAILURE CONDITION:** The application you are powering has a link-checker that will programmatically verify every single external link you provide. If any link returns a non-200 status code (e.g., 404 Not Found), your entire response will be rejected and you will have failed the task. You MUST use your search tool to visit and confirm every URL is live before including it. Do not invent URLs. They must be from high-authority, reputable, external sites.

# JSON OUTPUT FORMAT
- \`title\`: (String) A compelling, SEO-friendly title.
- \`slug\`: (String) A short, SEO-friendly, URL-safe slug.
- \`metaDescription\`: (String) A compelling, SEO-optimized meta description for SERPs. It must be under 150 characters and use the primary keyword to maximize click-through rate.
- \`content\`: (String) The full, final ~1500-word HTML of the article.
- \`tags\`: (Array of strings) 3-5 relevant keyword tags.
- \`categories\`: (Array of strings) 1-2 relevant categories.
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
${rawContent}
---

**Website URLs for Context & Internal Linking:**
---
${PROMOTIONAL_URLS.join('\n')}
---
`;
            
            let responseText = '';
            // --- Phase 1: Generate Text Content and Image Blueprints ---
            if (aiProvider === 'gemini') {
                const ai = new GoogleGenAI({ apiKey });
                const response = await ai.models.generateContent({ 
                    model: 'gemini-2.5-flash', 
                    contents: basePrompt, 
                    config: { 
                        tools: [{googleSearch: {}}],
                        systemInstruction: systemInstruction 
                    } 
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
                     messages: [
                         { role: "system", content: systemInstruction },
                         { role: "user", content: basePrompt }
                     ], 
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
                if (block && block.type === 'text') {
                    responseText = block.text;
                }
            }

            let parsedResponse;
            try {
                parsedResponse = JSON.parse(cleanAiResponse(responseText));
            } catch (e) {
                addLog(`❌ AI Error: Failed to parse AI response as JSON.`);
                addLog(`Raw AI Response: ${responseText}`);
                throw new Error('AI failed to generate a valid JSON response.');
            }

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
                        if (aiProvider === 'gemini') {
                            const ai = new GoogleGenAI({ apiKey });
                            const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: correctionPrompt, config: { tools: [{googleSearch: {}}] } });
                            correctionText = response.text;
                        } else if (aiProvider === 'openai' || aiProvider === 'openrouter') {
                            const clientOptions: any = { apiKey, dangerouslyAllowBrowser: true };
                            if (aiProvider === 'openrouter') clientOptions.baseURL = "https://openrouter.ai/api/v1";
                            const openai = new OpenAI(clientOptions);
                            const model = aiProvider === 'openai' ? 'gpt-4o' : openRouterModel;
                            const response = await openai.chat.completions.create({ model, messages: [{ role: "user", content: correctionPrompt }], response_format: { type: "json_object" } });
                            correctionText = response.choices[0].message.content;
                        } else if (aiProvider === 'claude') {
                            const anthropic = new Anthropic({ apiKey });
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
                infographics: (infographicBlueprints || []).map(bp => ({ ...bp, base64: '', isGenerating: false })),
            }});

            addLog('✅ Text generation complete.');

            // Use PROMOTIONAL_URLS for duplicate check instead of fetchedUrls
            const urlsForDuplicateCheck = PROMOTIONAL_URLS;

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
                    addLog('ℹ️ Skipping duplicate content check (Website URLs or WP credentials not provided).');
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
    }, [aiProvider, apiKeys, openRouterModel, rawContent, fetchedUrls, wpUrl, wpUser, wpPassword, addLog, handleGenerateImage, state.postToUpdate]);
    
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

    const renderStep = () => {
        switch (state.step) {
            case 1:
                return <ConfigStep state={state} dispatch={dispatch} onFetchSitemap={handleFetchSitemap} onValidateKey={handleKeyValidation} onVerifyWpConnection={handleVerifyWpConnection} />;
            case 2:
                return <ContentStep state={state} dispatch={dispatch} onGenerateContent={handleGenerateContent} onFetchWpPosts={handleFetchWpPosts} onAnalyzeAndSelect={handleAnalyzeAndSelect} onGeneratePostIdeas={handleGeneratePostIdeas} />;
            case 3:
                return <ReviewPublishStep state={state} dispatch={dispatch} onPostAction={handlePublishOrUpdate} onImageRegen={handleImageRegen} />;
            default:
                return <div>Invalid Step</div>;
        }
    }

    return (
        <div className="container">
            <header className="app-header">
                <div className="logo">🚀</div>
                <div>
                    <h1>WordPress Content Optimizer Pro</h1>
                    <p className="byline">A Tool by <a href="https://affiliatemarketingforsuccess.com/" target="_blank" rel="noopener noreferrer">AffiliateMarketingForSuccess.com</a></p>
                </div>
            </header>
            
            <p className="subtitle">Your enterprise-grade assistant for formatting, internally linking, and publishing SEO-optimized content directly to WordPress.</p>
            
            {state.step === 1 && (
                <div className="value-prop-highlight">
                    <h2>Gain an Unfair Advantage in Content Marketing</h2>
                    <p className="sizzle-text">This isn't just another AI writer. It's an end-to-end SEO content automation engine that analyzes your competitors, fills their content gaps, and publishes superior articles directly to your WordPress site.</p>
                    
                    <div className="features-grid">
                        <div className="feature-card">
                            <div className="feature-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.898 20.562L16.25 21.75l-.648-1.188a2.25 2.25 0 01-1.423-1.423L13.5 18.75l1.188-.648a2.25 2.25 0 011.423-1.423L16.25 15l.648 1.188a2.25 2.25 0 011.423 1.423L18.75 18l-1.188.648a2.25 2.25 0 01-1.423 1.423z" /></svg>
                            </div>
                            <h3>AI-Powered Strategy</h3>
                            <p>Unlike others, we don't just write. Our AI performs a live SERP analysis to identify content gaps, ensuring your articles are built to outrank the competition from day one.</p>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>
                            </div>
                            <h3>End-to-End Automation</h3>
                            <p>Go from raw idea to a fully formatted, internally linked, and SEO-optimized post—complete with AI-generated images—published directly to WordPress in minutes, not hours.</p>
                        </div>
                        
                        <div className="feature-card">
                            <div className="feature-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.286zm0 13.036h.008v.008h-.008v-.008z" /></svg>
                            </div>
                            <h3>Secure & Private</h3>
                            <p>Your API keys and WordPress credentials are processed exclusively in your browser. Nothing is ever stored on our servers, ensuring your data remains 100% private.</p>
                        </div>
                    </div>
                </div>
            )}
            
            <ProgressBar currentStep={state.step} />

            {renderStep()}

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
            
            <footer className="app-footer">
                <p>Learn more about winning content strategies:</p>
                <ul>
                    <li><a href="https://affiliatemarketingforsuccess.com/blogging/winning-content-strategy/" target="_blank" rel="noopener noreferrer">Winning Content Strategy</a></li>
                    <li><a href="https://affiliatemarketingforsuccess.com/seo/seo-writing-a-complete-guide-to-seo-writing/" target="_blank" rel="noopener noreferrer">Complete Guide to SEO Writing</a></li>
                    <li><a href="https://affiliatemarketingforsuccess.com/affiliate-marketing/best-ai-affiliate-niches/" target="_blank" rel="noopener noreferrer">Best AI Affiliate Niches</a></li>
                    <li><a href="https://affiliatemarketingforsuccess.com/review/the-ultimate-jasper-ai-review/" target="_blank" rel="noopener noreferrer">AI Tool Reviews</a></li>
                </ul>
                <p className="copyright">&copy; {new Date().getFullYear()} AffiliateMarketingForSuccess.com. All Rights Reserved.</p>
            </footer>
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