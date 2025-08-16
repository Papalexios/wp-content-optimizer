
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


const ProgressBar = ({ currentStep }: { currentStep: number }) => {
    const steps = ['Config', 'Content', 'Review & Publish'];
    return (
        <ol className="progress-bar">
            {steps.map((name, index) => {
                const stepIndex = index + 1;
                const status = stepIndex < currentStep ? 'completed' : stepIndex === currentStep ? 'active' : '';
                return (
                    <li key={name} className={`progress-step ${status}`}>
                        <div className="step-circle">{stepIndex < currentStep ? '✔' : stepIndex}</div>
                        {name}
                    </li>
                );
            })}
        </ol>
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


const ConfigStep = ({ state, dispatch, onFetchSitemap, onValidateKey }) => {
    const { wpUrl, wpUser, wpPassword, sitemapUrl, urlLimit, loading, aiProvider, apiKeys, openRouterModel, keyStatus } = state;
    const isSitemapConfigValid = useMemo(() => sitemapUrl && sitemapUrl.trim() !== '', [sitemapUrl]);
    
    const isApiKeyValid = useMemo(() => {
        // A key is valid enough to proceed if it has been entered and has not been marked as invalid.
        // This provides a more responsive feel, allowing the user to proceed while validation runs.
        const keyIsEntered = apiKeys[aiProvider] && apiKeys[aiProvider].trim() !== '';
        return keyIsEntered && keyStatus[aiProvider] !== 'invalid';
    }, [apiKeys, aiProvider, keyStatus]);

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
                    <input type="url" id="sitemapUrl" value={sitemapUrl} onChange={handleChange} placeholder="https://example.com/sitemap.xml" required />
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
                <button onClick={() => onFetchSitemap(false)} className="btn" style={{backgroundColor: '#4B5563'}} disabled={loading.sitemap || !isApiKeyValid}>
                    Proceed without Sitemap
                </button>
                <button onClick={() => onFetchSitemap(true)} className="btn" disabled={loading.sitemap || !isSitemapConfigValid || !isApiKeyValid}>
                    {loading.sitemap ? 'Fetching...' : 'Fetch Sitemap & Proceed'}
                </button>
            </div>
        </div>
    );
};

const ContentStep = ({ state, dispatch, onGenerateContent, onFetchWpPosts, onAnalyzeAndSelect, onGeneratePostIdeas }) => {
    const { rawContent, loading, wpPosts, postToUpdate, wpUrl, wpUser, wpPassword, fetchedUrls, postIdeas } = state;
    const [mode, setMode] = useState('new');
    const [searchTerm, setSearchTerm] = useState('');

    const isWpConfigured = useMemo(() => wpUrl && wpUser && wpPassword, [wpUrl, wpUser, wpPassword]);

    const handleModeChange = (newMode) => {
        if (newMode !== mode) {
            setMode(newMode);
            dispatch({ type: 'CLEAR_UPDATE_SELECTION' });
        }
    };
    
    const filteredPosts = useMemo(() => {
        if (!wpPosts) return [];
        return wpPosts.filter(post => post.title.rendered.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [wpPosts, searchTerm]);

    const renderUpdateMode = () => (
        <>
            {!isWpConfigured ? (
                 <div className="warning-box" style={{margin: '0 0 2rem 0'}}>
                    <h4>WordPress Credentials Required</h4>
                    <p>Please provide your WordPress URL, Username, and Application Password in the 'Config' step to load and update existing posts.</p>
                </div>
            ) : postToUpdate ? (
                <div className="selection-locked-box">
                    <h4>Post Selected for Update</h4>
                    <p><strong>Title:</strong> {wpPosts.find(p => p.id === postToUpdate.id)?.title.rendered}</p>
                    <p>The content below has been loaded from this post. You can now proceed to optimize it.</p>
                    <button onClick={() => dispatch({type: 'CLEAR_UPDATE_SELECTION'})} className="btn" style={{backgroundColor: '#4B5563', width: 'auto', marginTop: '1rem'}}>Select a Different Post</button>
                </div>
            ) : (
                <div className="posts-list-container">
                    {wpPosts.length === 0 ? (
                        <button onClick={onFetchWpPosts} className="btn" disabled={loading.posts || !isWpConfigured}>
                            {loading.posts ? 'Loading Posts...' : 'Load Published Posts'}
                        </button>
                    ) : (
                        <>
                            <input
                                type="text"
                                placeholder="Search posts by title..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="posts-search-input"
                            />
                            <div className="posts-table-wrapper">
                                <table className="posts-table">
                                    <thead>
                                        <tr>
                                            <th>Title</th>
                                            <th>Date</th>
                                            <th>Main Keyword</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredPosts.map(post => (
                                            <tr key={post.id}>
                                                <td><a href={post.link} target="_blank" rel="noopener noreferrer">{post.title.rendered}</a></td>
                                                <td>
                                                    {new Date(post.date).toLocaleDateString('en-US', {
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric',
                                                    })}
                                                </td>
                                                <td>
                                                    {post.status === 'loading' && <div className="keyword-loading-spinner"></div>}
                                                    {post.keyword}
                                                </td>
                                                <td>
                                                    <button 
                                                        onClick={() => onAnalyzeAndSelect(post)} 
                                                        className="btn btn-small"
                                                        disabled={post.status === 'loading'}
                                                    >
                                                        {post.status === 'loading' ? 'Analyzing...' : 'Analyze & Select'}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </div>
            )}
            
            {postToUpdate && (
                <div className="form-group" style={{marginTop: '2rem'}}>
                    <label htmlFor="rawContent">Content from Existing Post</label>
                    <textarea id="rawContent" value={rawContent} onChange={e => dispatch({type: 'UPDATE_FIELD', payload: {field: 'rawContent', value: e.target.value}})} required></textarea>
                </div>
            )}
        </>
    );

    const renderNewMode = () => (
         <>
            <div className="post-ideas-generator">
                <h4>Need inspiration?</h4>
                <p className="help-text">Generate AI-powered blog post ideas based on your sitemap to fill content gaps and boost topical authority.</p>
                <button
                    onClick={onGeneratePostIdeas}
                    className="btn"
                    disabled={loading.ideas || fetchedUrls.length === 0}
                    style={{ width: 'auto', marginBottom: '1.5rem' }}
                >
                    {loading.ideas ? 'Generating Ideas...' : '✨ Generate 5 Post Ideas'}
                </button>
                {fetchedUrls.length === 0 && !loading.ideas && <p className="help-text">Fetch sitemap in the 'Config' step to enable this feature.</p>}
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
        </>
    );

    return (
        <div className="step-container" id="step-2-content">
            <div className="content-mode-toggle">
                <button onClick={() => handleModeChange('new')} className={mode === 'new' ? 'active' : ''}>Create New Post</button>
                <button onClick={() => handleModeChange('update')} className={mode === 'update' ? 'active' : ''}>Update Existing Post</button>
            </div>

            {mode === 'new' ? renderNewMode() : renderUpdateMode()}

            <div className="button-group">
                <button onClick={() => dispatch({type: 'SET_STEP', payload: 1})} className="btn" style={{backgroundColor: '#4B5563'}}>Back to Config</button>
                <button onClick={onGenerateContent} className="btn" disabled={loading.content || !rawContent}>
                    {loading.content ? 'Generating...' : (postToUpdate ? 'Optimize Existing Content' : 'Optimize New Content')}
                </button>
            </div>
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
    const { finalTitle, slug, finalContent, tags, categories, featuredImage, loading, infographics, duplicateInfo, publishMode } = state;

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

    return (
        <div id="step-3-review">
            {duplicateInfo.similarUrl && publishMode === 'update' && (
                 <div className="warning-box">
                    <h4>⚠️ Updating Existing Post</h4>
                    <p>You are about to update an existing article. The new content below will replace the current version on your website.</p>
                    <p><strong>Existing Article:</strong> <a href={duplicateInfo.similarUrl} target="_blank" rel="noopener noreferrer">{duplicateInfo.similarUrl}</a></p>
                </div>
            )}
            <div className="review-layout">
                <div className="review-panel">
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
                <div className="review-panel">
                    <h3>Live Preview</h3>
                    <div className="review-panel-content live-preview" dangerouslySetInnerHTML={{ __html: renderedContent }} />
                </div>
            </div>
            <div className="button-group" style={{maxWidth: '1200px', margin: '2rem auto 0'}}>
                <button onClick={() => dispatch({type: 'SET_STEP', payload: 2})} className="btn" style={{backgroundColor: '#4B5563'}}>Back to Content</button>
                <button onClick={() => onPostAction(publishMode)} className="btn" disabled={loading.publish}>
                    {loading.publish 
                        ? (publishMode === 'update' ? 'Updating...' : 'Publishing...')
                        : (publishMode === 'update' ? 'Update Existing Post' : 'Publish to WordPress')
                    }
                </button>
            </div>
        </div>
    );
};

const initialState = {
    step: 1,
    loading: { sitemap: false, content: false, publish: false, featuredImage: false, posts: false, ideas: false },
    logs: [],
    result: null,
    wpUrl: '',
    wpUser: '',
    wpPassword: '',
    sitemapUrl: '',
    urlLimit: 500,
    fetchedUrls: [],
    rawContent: '',
    finalTitle: '',
    slug: '',
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
    wpPosts: [], // { id, title, link, date, keyword, content, status }
    postToUpdate: null, // { id, link }
    postIdeas: [],
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
                wpUrl: '', wpUser: '', wpPassword: '', sitemapUrl: '', urlLimit: 500,
                aiProvider: 'gemini', apiKeys: { gemini: '', openai: '', claude: '', openrouter: '' },
                keyStatus: { gemini: 'idle', openai: 'idle', claude: 'idle', openrouter: 'idle' }
            };
        case 'UPDATE_FIELD':
            return { ...state, [action.payload.field]: action.payload.value };
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
            return { ...state, wpPosts: action.payload };
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
                postToUpdate: { id: action.payload.id, link: action.payload.link },
            };
        case 'CLEAR_UPDATE_SELECTION':
            return { ...state, postToUpdate: null, rawContent: '' };
        case 'SET_POST_IDEAS':
            return { ...state, postIdeas: action.payload };
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
        tags, categories, featuredImage, infographics
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
            const apiUrl = `${wpUrl.replace(/\/$/, '')}/wp-json/wp/v2/posts?status=publish&per_page=100&_fields=id,title,link,date`;
            const credentials = btoa(`${wpUser}:${wpPassword}`);
            const headers = { 'Authorization': `Basic ${credentials}` };

            const response = await fetch(apiUrl, { headers });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`WP Error: ${errorData.message || response.statusText}`);
            }

            const posts = await response.json();
            const postsWithStatus = posts.map(p => ({ ...p, status: 'idle', keyword: '' }));
            dispatch({ type: 'SET_WP_POSTS', payload: postsWithStatus });
            addLog(`✅ Found ${posts.length} published posts.`);
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
            if (fetchedUrls.length === 0) throw new Error('Sitemap URLs are required to generate ideas.');

            const prompt = `You are a world-class SEO strategist and content planner with deep expertise in establishing topical authority for websites.

Your task is to analyze the following list of URLs, which represent the sitemap of a website. Based on this analysis, generate 5 high-quality blog post ideas that will strategically fill content gaps and bridge existing topics to significantly boost the site's topical authority and organic rankings.

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

### SITEMAP URLs FOR ANALYSIS:
---
${fetchedUrls.slice(0, 200).join('\n')}
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
### TASK: UPDATE EXISTING CONTENT
You are updating an existing article. Your task is to substantially improve it.
- **Analyze the original content** provided in the "Raw Text" section.
- **Refresh outdated information** and add new, relevant details.
- **Improve SEO** by refining keywords and structure based on a fresh competitive analysis.
- **Enhance readability and engagement** using the Alex Hormozi style.
- **The final output must be a complete replacement for the old article**, following all other structural and JSON format rules.
` : '';

            const basePrompt = `
You are a world-class SEO content strategist and a subject matter expert, channeling the writing style of Alex Hormozi. Your writing is direct, value-packed, and provides actionable frameworks. You challenge conventional wisdom and deliver insights with extreme clarity. Your task is to transform the given raw text into a comprehensive, ~1500-word, SEO-optimized blog post that is designed to outrank competitors.
${updateInstructions}

### CRITICAL INSTRUCTIONS
1.  The final output MUST be a single, raw JSON object, with no markdown formatting around it.
2.  Use Google Search grounding to perform real-time analysis of the topic.

### YOUR STRATEGIC PROCESS:

1.  **Analyze & Deconstruct:** From the "Raw Text," identify the primary keyword and core concepts.
2.  **Competitive & Gap Analysis (Simulated via Search Grounding):**
    *   Analyze the current top 5 Google SERP results for the primary keyword to understand what they cover well.
    *   Identify all common "People Also Ask" (PAA) questions related to the topic.
    *   **Crucially, identify thematic gaps:** What important aspects are the top competitors NOT covering in-depth? What unique angles can be taken? What PAA questions are only superficially answered? Your goal is to fill these gaps.
3.  **Outline Creation:** Based on your analysis, create a detailed outline for a ~1500-word article. The outline must be structured to:
    *   Cover all aspects of the main keyword comprehensively.
    *   **Explicitly answer 100% of the "People Also Ask" questions.**
    *   **Prioritize and elaborate on the identified content gaps** to provide unique value.
4.  **Drafting (Alex Hormozi Style):** Write the full article based on the outline.
    *   **Word Count:** Target approximately 1500 words of high-quality, helpful content.
    *   **Style & Tone:** Direct, no-fluff, authoritative. Use short sentences, bold statements, numbered lists, and actionable frameworks (e.g., "The 3-Step Framework for X"). Make it easy to read and highly scannable.
    *   **Keyword Integration:** Strategically and naturally weave the primary keyword and a rich set of semantically relevant LSI keywords throughout the headings and body content.
    *   **Internal Linking:** Analyze the provided "Sitemap URLs" and insert 6-10 of them as contextually relevant hyperlinks within the body of the article. DO NOT create links inside headings.

### REQUIRED CONTENT STRUCTURE (IN HTML):

1.  **Introduction**: A captivating, Hormozi-style hook that challenges a common belief or presents a startling fact. Must be 3-4 sentences.
2.  **Key Takeaways**: An \`<h3>\` titled "Key Takeaways" inside a \`<div class="key-takeaways">\`. Provide a bulleted list (\`<ul>\`) of the 3 most powerful, actionable points from the article.
3.  **Main Content Body**: The ~1500-word article, perfectly structured with \`<h2>\`, \`<h3>\`, \`<h4>\`, \`<p>\`, \`<ul>\`, \`<ol>\`, and \`<strong>\` tags. This section must cover all aspects identified in your analysis, including PAA and content gaps.
4.  **Infographics & Image Prompts**: Identify 3-4 key concepts that can be visualized. Insert unique HTML comment placeholders (\`<!-- INFOGRAPHIC-PLACEHOLDER-{UUID} -->\`) where they should appear and create corresponding blueprints in the JSON.
5.  **Conclusion**: A strong, summarizing conclusion that provides a clear call to action or a final powerful takeaway for the reader.
6.  **References Section**: An \`<h3>\` titled "References" inside a \`<div class="references-section">\`. Provide an unordered list (\`<ul>\`) of 8-12 hyperlinks to EXTERNAL, reputable, authoritative sites that support the content.

### JSON OUTPUT FORMAT
- \`title\`: (String) A compelling, SEO-friendly title.
- \`slug\`: (String) A short, SEO-friendly, URL-safe slug.
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

### RAW DATA FOR PROCESSING
**Raw Text:**
---
${rawContent}
---

**Sitemap URLs for Context & Internal Linking:**
---
${fetchedUrls.join('\n')}
---
`;
            
            let responseText = '';
            // --- Phase 1: Generate Text Content and Image Blueprints ---
            if (aiProvider === 'gemini') {
                const ai = new GoogleGenAI({ apiKey });
                const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: basePrompt, config: { tools: [{googleSearch: {}}] } });
                responseText = response.text;
            } else if (aiProvider === 'openai' || (aiProvider === 'openrouter' && openRouterModel)) {
                 const clientOptions: any = { apiKey, dangerouslyAllowBrowser: true };
                 if (aiProvider === 'openrouter') clientOptions.baseURL = "https://openrouter.ai/api/v1";
                 const openai = new OpenAI(clientOptions);
                 const model = aiProvider === 'openai' ? 'gpt-4o' : openRouterModel;
                 addLog(`Using model: ${model}`);
                 const response = await openai.chat.completions.create({ model, messages: [{ role: "user", content: basePrompt }], response_format: { type: "json_object" } });
                 responseText = response.choices[0].message.content;
            } else if (aiProvider === 'claude') {
                const anthropic = new Anthropic({ apiKey });
                const response = await anthropic.messages.create({ model: "claude-3-haiku-20240307", max_tokens: 4096, messages: [{ role: "user", content: `${basePrompt}\n\nIMPORTANT: Respond with ONLY the raw JSON object.` }]});
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

            const { title, content, slug, tags, categories, infographics: infographicBlueprints, featuredImagePrompt } = parsedResponse;
            
            if (isUpdate) {
                dispatch({ type: 'SET_DUPLICATE_INFO', payload: { similarUrl: state.postToUpdate.link, postId: state.postToUpdate.id } });
                dispatch({ type: 'SET_PUBLISH_MODE', payload: 'update' });
            }

            dispatch({type: 'SET_GENERATED_CONTENT', payload: {
                finalTitle: title,
                finalContent: content,
                slug: slug || '',
                tags: tags || [],
                categories: categories || [],
                featuredImage: { prompt: featuredImagePrompt, base64: '' },
                infographics: (infographicBlueprints || []).map(bp => ({ ...bp, base64: '', isGenerating: false })),
            }});

            addLog('✅ Text generation complete.');

            if (!isUpdate) {
                addLog('Checking for duplicate content...');
                 if (fetchedUrls.length > 0 && wpUrl && wpUser && wpPassword) {
                    if (apiKeys.gemini) {
                        try {
                            const duplicateCheckPrompt = `You are an SEO assistant. A new blog post with the title "${title}" is being created. Based on this title, find the SINGLE most similar URL from the following list. Respond with ONLY the URL if a strong match is found, otherwise respond with the exact string "null".\n\nURL List:\n${fetchedUrls.join('\n')}`;
                            const ai = new GoogleGenAI({ apiKey: apiKeys.gemini });
                            const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: duplicateCheckPrompt, config: { thinkingConfig: { thinkingBudget: 0 } } });
                            const similarUrl = response.text.trim();

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
                        addLog('🟡 Skipping duplicate content check: Gemini API key not provided.');
                    }
                } else {
                    addLog('ℹ️ Skipping duplicate content check (sitemap URLs or WP credentials not provided).');
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
        const { postId } = state.duplicateInfo;

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
                addLog(`🏷️ Processing ${pluralName}...`);
                const termIds = await Promise.all(terms.map(async (termName) => {
                    const searchResponse = await fetch(`${apiUrl}/${endpoint}?search=${encodeURIComponent(termName)}`, { headers: baseHeaders });
                    const existingTerms = await searchResponse.json();
                    const exactMatch = existingTerms.find(t => t.name.toLowerCase() === termName.toLowerCase());
                    if (exactMatch) return exactMatch.id;
                    
                    addLog(`Creating new ${singularName}: "${termName}"...`);
                    const createResponse = await fetch(`${apiUrl}/${endpoint}`, { method: 'POST', headers: {...baseHeaders, 'Content-Type': 'application/json'}, body: JSON.stringify({ name: termName }) });
                     if (!createResponse.ok) {
                         const errorData = await createResponse.json();
                         throw new Error(`WP Error creating ${singularName}: ${errorData.message || `Failed to create ${termName}`}`);
                     }
                    const newTerm = await createResponse.json();
                    return newTerm.id;
                }));
                return termIds.filter(id => id != null);
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
            dispatch({ type: 'SET_RESULT', payload: { type: 'success', message: `Post ${resultAction}! <a href="${postResult.link}" target="_blank" rel="noopener noreferrer">View Post</a>` }});

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            const action = isUpdate ? 'Updating' : 'Publishing';
            addLog(`❌ ${action} Error: ${errorMessage}`);
            dispatch({ type: 'SET_RESULT', payload: { type: 'error', message: `${action} error: ${errorMessage}` } });
        } finally {
            dispatch({ type: 'SET_LOADING_STATE', payload: { publish: false } });
        }
    }, [wpUrl, wpUser, wpPassword, finalTitle, slug, finalContent, tags, categories, featuredImage, infographics, state.duplicateInfo, addLog]);

    const renderStep = () => {
        switch (state.step) {
            case 1:
                return <ConfigStep state={state} dispatch={dispatch} onFetchSitemap={handleFetchSitemap} onValidateKey={handleKeyValidation} />;
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
            <h1>WordPress Content Optimizer Pro</h1>
            <p className="subtitle">Your enterprise-grade assistant for formatting, internally linking, and publishing SEO-optimized content directly to WordPress.</p>
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
