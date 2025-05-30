import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useEffect, useState } from 'react';
import { BsCheckCircle, BsExclamationTriangle, BsXCircle, BsInfoCircle, BsArrowRight, BsCode, BsLightbulb } from 'react-icons/bs';
import { Button } from '@/components/ui/button';

interface SeoIssue {
  type?: string;
  element?: string;
  issue?: string;
  suggestion?: string;
  severity?: 'low' | 'medium' | 'high';
}

interface SeoSection {
  title: string;
  issues: SeoIssue[];
}

interface SeoPageAnalysis {
  filePath: string;
  score: number;
  sections: SeoSection[];
  suggestedKeywords: string[];
}

interface SeoResults {
  projectId: string;
  overallScore: number;
  totalIssues: number;
  detailedAnalysis: SeoPageAnalysis[];
}

interface SeoDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  scanResults: SeoResults | null;
  emailSent: boolean;
}

// Helper function to generate specific fix instructions based on issue type
const getFixInstructions = (issue: SeoIssue): string[] => {
  const type = issue.type?.toLowerCase() || '';
  const element = issue.element || '';
  const suggestion = issue.suggestion || '';
  
  // Default instructions if we can't determine the type
  let instructions: string[] = [suggestion];
  
  if (type.includes('title')) {
    instructions = [
      `Identify your primary keyword(s) for this page`,
      `Create a title that includes these keywords near the beginning`,
      `Keep title length between 50-60 characters`,
      `Replace the current title tag with your optimized version`,
      `Example: <title>Primary Keyword | Secondary Keyword - Brand Name</title>`
    ];
  } else if (type.includes('meta') || type.includes('description')) {
    instructions = [
      `Identify the main purpose and value proposition of the page`,
      `Include primary and secondary keywords naturally in the description`,
      `Add a call-to-action if appropriate`,
      `Keep length between 150-160 characters`,
      `Replace or add the meta description tag in the head section`,
      `Example: <meta name="description" content="Your optimized description here">`
    ];
  } else if (type.includes('h1') || type.includes('heading')) {
    instructions = [
      `Ensure your H1 clearly describes the page content and includes your primary keyword`,
      `Use only one H1 tag per page`,
      `Keep the H1 consistent with your title tag and page content`,
      `Example: <h1>Your Primary Keyword: Descriptive Heading</h1>`
    ];
  } else if (type.includes('img') || type.includes('image') || type.includes('alt')) {
    instructions = [
      `Add descriptive alt text to all images that describes the image content`,
      `Include relevant keywords naturally (but don't keyword stuff)`,
      `Keep alt text concise but descriptive (about 5-8 words)`,
      `Example: <img src="image.jpg" alt="Descriptive keyword-rich alt text">`
    ];
  } else if (type.includes('content') || type.includes('text')) {
    instructions = [
      `Expand your content to at least 300-500 words for basic pages, 1000+ for important topics`,
      `Include your primary keyword in the first paragraph`,
      `Use secondary keywords naturally throughout the content`,
      `Break up content with subheadings (H2, H3) that include keywords`,
      `Add internal links to related content on your site`
    ];
  } else if (type.includes('link') || type.includes('anchor')) {
    instructions = [
      `Replace generic link text like "click here" with descriptive, keyword-rich anchor text`,
      `Ensure link text accurately describes the destination page`,
      `Keep link text concise but descriptive`,
      `Example: <a href="page.html">Descriptive keyword-rich link text</a> instead of <a href="page.html">click here</a>`
    ];
  } else if (type.includes('structure') || type.includes('hierarchy')) {
    instructions = [
      `Use proper heading hierarchy (H1 → H2 → H3)`,
      `Ensure your content is logically structured`,
      `Use only one H1 per page`,
      `Each section should have its own H2 or H3 heading`
    ];
  } else if (type.includes('speed') || type.includes('performance')) {
    instructions = [
      `Optimize and compress images before uploading`,
      `Minimize CSS and JavaScript files`,
      `Consider using a content delivery network (CDN)`,
      `Implement browser caching`,
      `Eliminate render-blocking resources`
    ];
  } else if (type.includes('mobile') || type.includes('responsive')) {
    instructions = [
      `Use responsive design principles`,
      `Test your page on multiple devices and screen sizes`,
      `Ensure text is readable without zooming`,
      `Make sure tap targets are appropriately sized`,
      `Avoid using technologies not supported on mobile (e.g., Flash)`
    ];
  }
  
  return instructions;
};

// Helper function to get priority label based on severity
const getPriorityLabel = (severity?: 'low' | 'medium' | 'high'): string => {
  switch (severity) {
    case 'high': return 'High Priority - Fix Immediately';
    case 'medium': return 'Medium Priority - Fix Soon';
    case 'low': return 'Low Priority - Consider Fixing';
    default: return 'Medium Priority - Fix Soon';
  }
};

// Helper function to get impact description based on issue type
const getImpactDescription = (issueType?: string): string => {
  const type = issueType?.toLowerCase() || '';
  
  if (type.includes('title')) {
    return 'Title tags are critical for SEO and are the first thing users see in search results. Optimizing them can significantly improve click-through rates.';
  } else if (type.includes('meta') || type.includes('description')) {
    return 'Meta descriptions influence click-through rates from search results by providing a summary of your page content.';
  } else if (type.includes('h1') || type.includes('heading')) {
    return 'H1 headings help search engines understand your page topic and structure. They also improve readability for users.';
  } else if (type.includes('img') || type.includes('image') || type.includes('alt')) {
    return 'Alt text helps search engines understand image content and improves accessibility for users with visual impairments.';
  } else if (type.includes('content') || type.includes('text')) {
    return 'High-quality, substantial content is one of the most important ranking factors for search engines.';
  } else if (type.includes('link') || type.includes('anchor')) {
    return 'Descriptive link text helps search engines understand the context and relationship between pages.';
  } 
  
  return 'Addressing this issue will help improve your overall SEO performance and user experience.';
};

export function SeoDetailsModal({ isOpen, onClose, scanResults, emailSent }: SeoDetailsModalProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedPage, setSelectedPage] = useState<SeoPageAnalysis | null>(null);
  const [expandedIssues, setExpandedIssues] = useState<Set<string>>(new Set());

  // Reset selected page when modal opens with new results
  useEffect(() => {
    if (isOpen && scanResults) {
      setSelectedPage(scanResults.detailedAnalysis?.[0] || null);
      setExpandedIssues(new Set());
    }
  }, [isOpen, scanResults]);

  if (!scanResults) return null;
  
  // Safely calculate counts to avoid errors
  const pagesCount = scanResults?.detailedAnalysis?.length || 0;
  const totalIssues = scanResults?.totalIssues || 0;
  const estimatedImprovement = totalIssues > 0 ? 
    Math.min(Math.round(totalIssues * 1.5), 100 - (scanResults.overallScore || 0)) : 0;
  
  const currentScore = scanResults?.overallScore || 0;
  const potentialScore = Math.min(currentScore + estimatedImprovement, 100);

  // Toggle expanded state for an issue
  const toggleIssueExpanded = (issueKey: string) => {
    const newExpanded = new Set(expandedIssues);
    if (newExpanded.has(issueKey)) {
      newExpanded.delete(issueKey);
    } else {
      newExpanded.add(issueKey);
    }
    setExpandedIssues(newExpanded);
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-5xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-900 p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-2xl font-bold leading-6 text-gray-900 dark:text-gray-100 mb-6 flex justify-between items-center"
                >
                  <span>SEO Analysis</span>
                  {emailSent && (
                    <div className="text-sm font-normal text-green-600 dark:text-green-400 flex items-center">
                      <BsCheckCircle className="mr-1" />
                      SEO analysis report has been sent to your email
                    </div>
                  )}
                </Dialog.Title>

                <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg text-center">
                    <div className="text-sm text-gray-500 dark:text-gray-400">Pages Analyzed</div>
                    <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{pagesCount}</div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg text-center">
                    <div className="text-sm text-gray-500 dark:text-gray-400">Total Issues</div>
                    <div className="text-3xl font-bold text-amber-600 dark:text-amber-400">{totalIssues}</div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg text-center">
                    <div className="text-sm text-gray-500 dark:text-gray-400">Estimated Improvement</div>
                    <div className="text-3xl font-bold text-green-600 dark:text-green-400">+{estimatedImprovement}%</div>
                  </div>
                </div>

                <div className="flex border-b space-x-4 mb-6">
                  <button
                    className={`pb-2 font-medium text-sm ${
                      activeTab === 'overview'
                        ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}
                    onClick={() => setActiveTab('overview')}
                  >
                    Overview
                  </button>
                  <button
                    className={`pb-2 font-medium text-sm ${
                      activeTab === 'pages'
                        ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}
                    onClick={() => setActiveTab('pages')}
                  >
                    Pages
                  </button>
                </div>

                {activeTab === 'overview' && (
                  <div>
                    <div className="mb-6">
                      <h4 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100">Overall SEO Score</h4>
                      <div className="flex items-center">
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                          <div
                            className={`h-4 rounded-full ${
                              currentScore >= 80
                                ? 'bg-green-500'
                                : currentScore >= 50
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                            }`}
                            style={{ width: `${currentScore}%` }}
                          ></div>
                        </div>
                        <span className="ml-3 font-semibold text-gray-900 dark:text-gray-100">{currentScore}%</span>
                      </div>
                    </div>

                    <div className="mb-8">
                      <h4 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100">
                        Potential SEO Score After Fixes
                      </h4>
                      <div className="flex items-center">
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                          <div
                            className={`h-4 rounded-full ${
                              potentialScore >= 80
                                ? 'bg-green-500'
                                : potentialScore >= 50
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                            }`}
                            style={{ width: `${potentialScore}%` }}
                          ></div>
                        </div>
                        <span className="ml-3 font-semibold text-gray-900 dark:text-gray-100">{potentialScore}%</span>
                      </div>
                    </div>

                    <div className="mb-8">
                      <h4 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100">
                        Top Priority Fixes
                      </h4>
                      
                      {totalIssues > 0 ? (
                        <div className="space-y-4">
                          {Array.from(new Set(
                            (scanResults.detailedAnalysis || []).flatMap(page => 
                              (page.sections || []).flatMap(section => 
                                (section.issues || []).filter(issue => issue.severity === 'high').map(issue => ({ ...issue, page: page.filePath }))
                              )
                            )
                          )).slice(0, 3).map((issue, i) => (
                            <div key={i} className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-lg p-4">
                              <div className="flex items-start">
                                <BsExclamationTriangle className="text-red-500 mr-2 mt-1 flex-shrink-0" />
                                <div>
                                  <div className="font-medium text-gray-900 dark:text-gray-100">{issue.issue}</div>
                                  <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                                    File: <span className="font-mono">{issue.page}</span>
                                  </div>
                                  <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                                    {issue.suggestion}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-gray-500 dark:text-gray-400">
                          No high-priority issues found. Good job!
                        </div>
                      )}
                    </div>

                    <h4 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100">
                      Common Issues Found
                    </h4>
                    
                    {totalIssues > 0 ? (
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6">
                        <ul className="space-y-3">
                          {Array.from(new Set(
                            (scanResults.detailedAnalysis || []).flatMap(page => 
                              (page.sections || []).flatMap(section => 
                                (section.issues || []).map(issue => issue.type)
                              )
                            )
                          )).slice(0, 5).map((issueType, i) => (
                            <li key={i} className="flex items-start">
                              <BsExclamationTriangle className="text-amber-500 mr-2 mt-1 flex-shrink-0" />
                              <span className="text-gray-700 dark:text-gray-300">{issueType}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6 text-gray-500 dark:text-gray-400">
                        No significant issues found. Good job!
                      </div>
                    )}
                    
                    <h4 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100">
                      Suggested Keywords
                    </h4>
                    
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6">
                      <div className="flex flex-wrap gap-2">
                        {((scanResults.detailedAnalysis || [])[0]?.suggestedKeywords || []).map((keyword, i) => (
                          <span
                            key={i}
                            className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded text-sm"
                          >
                            {keyword}
                          </span>
                        ))}
                        {((scanResults.detailedAnalysis || [])[0]?.suggestedKeywords || []).length === 0 && (
                          <span className="text-gray-500 dark:text-gray-400">No keyword suggestions available</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'pages' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-1 border-r pr-4">
                      <h4 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100">Pages</h4>
                      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                        {(scanResults.detailedAnalysis || []).map((page, i) => (
                          <button
                            key={i}
                            className={`w-full text-left p-2 rounded-lg text-sm ${
                              selectedPage === page
                                ? 'bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-200'
                                : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                            }`}
                            onClick={() => setSelectedPage(page)}
                          >
                            <div className="font-medium truncate">{page.filePath}</div>
                            <div className="flex justify-between items-center mt-1">
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {(page.sections || []).reduce((sum, section) => sum + (section.issues || []).length, 0)} issues
                              </span>
                              <span
                                className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                  (page.score || 0) >= 80
                                    ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                                    : (page.score || 0) >= 50
                                    ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                                    : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                                }`}
                              >
                                {page.score || 0}%
                              </span>
                            </div>
                          </button>
                        ))}
                        
                        {(scanResults.detailedAnalysis || []).length === 0 && (
                          <div className="text-gray-500 dark:text-gray-400 p-2">
                            No pages analyzed
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      {selectedPage ? (
                        <>
                          <h4 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100">
                            {selectedPage.filePath}
                          </h4>
                          
                          <div className="mb-4">
                            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">SEO Score</div>
                            <div className="flex items-center">
                              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                                <div
                                  className={`h-2.5 rounded-full ${
                                    (selectedPage.score || 0) >= 80
                                      ? 'bg-green-500'
                                      : (selectedPage.score || 0) >= 50
                                      ? 'bg-yellow-500'
                                      : 'bg-red-500'
                                  }`}
                                  style={{ width: `${selectedPage.score || 0}%` }}
                                ></div>
                              </div>
                              <span className="ml-3 font-semibold text-gray-900 dark:text-gray-100">
                                {selectedPage.score || 0}%
                              </span>
                            </div>
                          </div>

                          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                            {(selectedPage.sections || []).map((section, i) => (
                              <div key={i} className="border-b pb-4 mb-4 last:border-0">
                                <h5 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                                  {section.title}
                                </h5>
                                
                                {(section.issues || []).length > 0 ? (
                                  <ul className="space-y-3">
                                    {(section.issues || []).map((issue, j) => {
                                      const issueKey = `${i}-${j}`;
                                      const isExpanded = expandedIssues.has(issueKey);
                                      const fixInstructions = getFixInstructions(issue);
                                      
                                      return (
                                        <li key={j} className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                                          <div className="flex items-start mb-1">
                                            <div
                                              className={`mr-2 flex-shrink-0 mt-0.5 ${
                                                (issue.severity || "medium") === 'high'
                                                  ? 'text-red-500'
                                                  : (issue.severity || "medium") === 'medium'
                                                  ? 'text-amber-500'
                                                  : 'text-yellow-500'
                                              }`}
                                            >
                                              <BsExclamationTriangle />
                                            </div>
                                            <div className="flex-1">
                                              <span className="text-gray-700 dark:text-gray-300 font-medium">
                                                {issue.issue || "No issue description available"}
                                              </span>
                                              <span
                                                className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${
                                                  (issue.severity || "medium") === 'high'
                                                    ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                                                    : (issue.severity || "medium") === 'medium'
                                                    ? 'bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200'
                                                    : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                                                }`}
                                              >
                                                {issue.severity || "medium"}
                                              </span>
                                            </div>
                                          </div>
                                          
                                          {issue.element && (
                                            <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded text-xs font-mono mb-2 overflow-x-auto">
                                              {issue.element}
                                            </div>
                                          )}
                                          
                                          {issue.suggestion && (
                                            <div className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                                              <span className="font-semibold">Suggestion:</span> {issue.suggestion}
                                            </div>
                                          )}
                                          
                                          <button 
                                            onClick={() => toggleIssueExpanded(issueKey)}
                                            className="text-blue-600 dark:text-blue-400 text-sm flex items-center mt-1"
                                          >
                                            <BsInfoCircle className="mr-1" />
                                            {isExpanded ? "Hide details" : "Show how to fix"}
                                          </button>
                                          
                                          {isExpanded && (
                                            <div className="mt-3 text-sm">
                                              <div className="mb-2 bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
                                                <div className="font-medium flex items-center text-blue-700 dark:text-blue-300 mb-1">
                                                  <BsLightbulb className="mr-1" />
                                                  Why this matters:
                                                </div>
                                                <p className="text-gray-700 dark:text-gray-300">
                                                  {getImpactDescription(issue.type)}
                                                </p>
                                              </div>
                                              
                                              <div className="font-medium text-gray-900 dark:text-gray-100 mb-1 flex items-center">
                                                <BsArrowRight className="mr-1" />
                                                {getPriorityLabel(issue.severity)}
                                              </div>
                                              
                                              <div className="font-medium text-gray-900 dark:text-gray-100 mt-2">How to fix:</div>
                                              <ol className="mt-1 space-y-1 list-decimal pl-5">
                                                {fixInstructions.map((instruction, idx) => (
                                                  <li key={idx} className="text-gray-700 dark:text-gray-300">{instruction}</li>
                                                ))}
                                              </ol>
                                              
                                              {issue.type?.toLowerCase().includes('title') && (
                                                <div className="mt-3 p-2 bg-green-50 dark:bg-green-900/20 rounded">
                                                  <div className="font-medium text-green-700 dark:text-green-300 flex items-center">
                                                    <BsCode className="mr-1" />
                                                    Example fix:
                                                  </div>
                                                  <pre className="text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded mt-1 overflow-x-auto">
                                                    <code>{`<title>Optimized Title with Keywords | Brand Name</title>`}</code>
                                                  </pre>
                                                </div>
                                              )}
                                            </div>
                                          )}
                                        </li>
                                      );
                                    })}
                                  </ul>
                                ) : (
                                  <div className="text-gray-500 dark:text-gray-400">No issues found in this section</div>
                                )}
                              </div>
                            ))}
                            
                            {(selectedPage.sections || []).length === 0 && (
                              <div className="text-gray-500 dark:text-gray-400">
                                No detailed analysis available for this page
                              </div>
                            )}
                          </div>
                        </>
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                          Select a page to view details
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="mt-6 flex justify-end">
                  <Button
                    onClick={onClose}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg"
                  >
                    Close
                  </Button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
} 