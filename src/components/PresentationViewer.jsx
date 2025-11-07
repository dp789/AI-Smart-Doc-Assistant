import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './PresentationViewer.css';

const PresentationViewer = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    // Slide 1: Introduction - Enhanced GenAI Project Overview
    {
      title: "Research Hyper Agentic Assistant",
      subtitle: "Next-Generation AI-Powered Research & Knowledge Management Platform",
      content: (
        <div className="slide-content-intro">
          <div className="intro-hero">
            <div className="hero-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
            </div>
            <h2 className="hero-title">Transform Your Research Workflow</h2>
            <p className="hero-description">
              Revolutionary GenAI platform combining <strong>multi-agent orchestration</strong>, 
              <strong>RAG technology</strong>, and <strong>n8n workflow automation</strong> to deliver 
              enterprise-grade intelligent document processing, semantic knowledge retrieval, 
              and autonomous AI agents for research excellence
            </p>
          </div>
          
          <div className="intro-features-grid">
            <div className="feature-card">
              <div className="feature-card-icon">🤖</div>
              <div className="feature-card-content">
                <h4>Multi-Agent AI System</h4>
                <p>Specialized AI agents: CV Screening, Transcript Analysis, Document Processing, and intelligent workflow orchestration</p>
              </div>
            </div>
            <div className="feature-card">
              <div className="feature-card-icon">⚡</div>
              <div className="feature-card-content">
                <h4>n8n Workflow Integration</h4>
                <p>Seamless automation with Nitor Infrastructure - orchestrate complex research pipelines with visual workflow builder</p>
              </div>
            </div>
            <div className="feature-card">
              <div className="feature-card-icon">🧠</div>
              <div className="feature-card-content">
                <h4>Advanced RAG Architecture</h4>
                <p>Retrieval-Augmented Generation with GPT-4, vector embeddings, and semantic search for accurate, context-aware responses</p>
              </div>
            </div>
            <div className="feature-card">
              <div className="feature-card-icon">🔗</div>
              <div className="feature-card-content">
                <h4>Intelligent Document Processing</h4>
                <p>Multi-modal AI extraction: OCR, table detection, image analysis, dual-granularity chunking with 3072-dimensional embeddings</p>
              </div>
            </div>
            <div className="feature-card">
              <div className="feature-card-icon">🎯</div>
              <div className="feature-card-content">
                <h4>Hyper-Personalized Insights</h4>
                <p>Context-aware AI that learns from your domain, provides citation-backed answers, and adapts to your research patterns</p>
              </div>
            </div>
            <div className="feature-card">
              <div className="feature-card-icon">🛡️</div>
              <div className="feature-card-content">
                <h4>Enterprise-Grade Security</h4>
                <p>Azure AD authentication, role-based access control, workspace isolation, and SOC 2 compliant infrastructure</p>
              </div>
            </div>
          </div>
        </div>
      ),
      theme: "intro"
    },

    // Slide 2: Platform Architecture with n8n Integration
    {
      title: "GenAI Platform Architecture",
      subtitle: "Nitor Infrastructure with n8n Orchestration",
      content: (
        <div className="slide-content-architecture">
          <div className="architecture-layer">
            <div className="layer-header">
              <span className="layer-number">1</span>
              <h4>Presentation Layer</h4>
            </div>
            <div className="layer-details">
              <span className="tech-badge">React 18</span>
              <span className="tech-badge">Material-UI</span>
              <span className="tech-badge">Azure AD Auth</span>
              <span className="tech-badge">Framer Motion</span>
            </div>
          </div>

          <div className="architecture-layer">
            <div className="layer-header">
              <span className="layer-number">2</span>
              <h4>API Gateway & Orchestration</h4>
            </div>
            <div className="layer-details">
              <span className="tech-badge">Node.js + Express</span>
              <span className="tech-badge">n8n Workflow Engine</span>
              <span className="tech-badge">RESTful APIs</span>
              <span className="tech-badge">Azure Logic Apps</span>
            </div>
          </div>

          <div className="architecture-layer">
            <div className="layer-header">
              <span className="layer-number">3</span>
              <h4>AI Agent Layer (Multi-Agent System)</h4>
            </div>
            <div className="layer-details">
              <span className="tech-badge">CV Screening Agent</span>
              <span className="tech-badge">Transcript Analyzer</span>
              <span className="tech-badge">Document Processor</span>
              <span className="tech-badge">RAG Chatbot Agent</span>
            </div>
          </div>

          <div className="architecture-layer">
            <div className="layer-header">
              <span className="layer-number">4</span>
              <h4>AI/ML Processing Pipeline</h4>
            </div>
            <div className="layer-details">
              <span className="tech-badge">Azure Functions</span>
              <span className="tech-badge">OpenAI GPT-4o</span>
              <span className="tech-badge">Python 3.11</span>
              <span className="tech-badge">LangChain</span>
            </div>
          </div>

          <div className="architecture-layer">
            <div className="layer-header">
              <span className="layer-number">5</span>
              <h4>Data & Vector Storage</h4>
            </div>
            <div className="layer-details">
              <span className="tech-badge">Azure SQL</span>
              <span className="tech-badge">Blob Storage</span>
              <span className="tech-badge">Pinecone Vector DB</span>
              <span className="tech-badge">Redis Cache</span>
            </div>
          </div>
        </div>
      ),
      theme: "architecture"
    },

    // Slide 3: Project Roadmap
    {
      title: "Project Roadmap & Journey",
      subtitle: "From Infrastructure to AI Excellence - 2 Months of Innovation",
      content: (
        <div className="slide-content-roadmap-journey">
          {/* Timeline Header */}
          <div className="roadmap-timeline-header">
            <div className="timeline-marker start-marker">
              <div className="marker-icon">🚀</div>
              <div className="marker-label">Project Kickoff<br/>August 2025</div>
            </div>
            <div className="timeline-line"></div>
            <div className="timeline-marker current-marker">
              <div className="marker-icon">⭐</div>
              <div className="marker-label">Current State<br/>October 2025</div>
            </div>
            <div className="timeline-line future-line"></div>
            <div className="timeline-marker future-marker">
              <div className="marker-icon">🎯</div>
              <div className="marker-label">Future Vision<br/>Q4 2025+</div>
            </div>
          </div>

          {/* Roadmap Phases */}
          <div className="roadmap-phases">
            {/* Phase 1: Infrastructure & DevOps */}
            <div className="roadmap-phase phase-complete">
              <div className="phase-header">
                <div className="phase-badge">Phase 1 - Complete ✓</div>
                <h4>Infrastructure & DevOps Foundation</h4>
                <span className="phase-date">August 2025 (Weeks 1-3)</span>
              </div>
              <div className="phase-content">
                <div className="milestone-grid">
                  <div className="milestone-item infra">
                    <div className="milestone-icon">☁️</div>
                    <div className="milestone-text">
                      <h5>Azure Infrastructure</h5>
                      <ul>
                        <li>Azure Web App setup & configuration</li>
                        <li>Resource Group & Subscription setup</li>
                        <li>Virtual Network & Security Groups</li>
                        <li>Storage Account (Blob, Queue, Table)</li>
                      </ul>
                    </div>
                  </div>

                  <div className="milestone-item devops">
                    <div className="milestone-icon">🔧</div>
                    <div className="milestone-text">
                      <h5>CI/CD Pipeline</h5>
                      <ul>
                        <li>Azure DevOps setup & configuration</li>
                        <li>Build pipeline for React frontend</li>
                        <li>Deployment pipeline automation</li>
                        <li>Environment-specific configs</li>
                      </ul>
                    </div>
                  </div>

                  <div className="milestone-item database">
                    <div className="milestone-icon">💾</div>
                    <div className="milestone-text">
                      <h5>Database Setup</h5>
                      <ul>
                        <li>Azure SQL Database provisioning</li>
                        <li>Schema design & table creation</li>
                        <li>Connection pooling setup</li>
                        <li>Backup & recovery configuration</li>
                      </ul>
                    </div>
                  </div>

                  <div className="milestone-item containers">
                    <div className="milestone-icon">📦</div>
                    <div className="milestone-text">
                      <h5>Containers & Functions</h5>
                      <ul>
                        <li>Azure Container Registry setup</li>
                        <li>Docker containerization</li>
                        <li>Azure Functions deployment</li>
                        <li>Service Bus queue integration</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Phase 2: Core Platform Development */}
            <div className="roadmap-phase phase-complete">
              <div className="phase-header">
                <div className="phase-badge">Phase 2 - Complete ✓</div>
                <h4>Core Platform Development</h4>
                <span className="phase-date">September 2025 (Weeks 4-7)</span>
              </div>
              <div className="phase-content">
                <div className="milestone-grid">
                  <div className="milestone-item auth">
                    <div className="milestone-icon">🔐</div>
                    <div className="milestone-text">
                      <h5>Authentication & Security</h5>
                      <ul>
                        <li>Azure AD B2C integration</li>
                        <li>MSAL authentication flow</li>
                        <li>Role-based access control</li>
                        <li>Session management</li>
                      </ul>
                    </div>
                  </div>

                  <div className="milestone-item document">
                    <div className="milestone-icon">📄</div>
                    <div className="milestone-text">
                      <h5>Document Management</h5>
                      <ul>
                        <li>Multi-source upload (Local, SharePoint, Web)</li>
                        <li>Document categorization & metadata</li>
                        <li>Workspace & folder structure</li>
                        <li>Document preview & download</li>
                      </ul>
                    </div>
                  </div>

                  <div className="milestone-item frontend">
                    <div className="milestone-icon">🎨</div>
                    <div className="milestone-text">
                      <h5>Frontend Development</h5>
                      <ul>
                        <li>React UI components with MUI</li>
                        <li>Responsive design & UX</li>
                        <li>State management (Redux)</li>
                        <li>Real-time notifications</li>
                      </ul>
                    </div>
                  </div>

                  <div className="milestone-item api">
                    <div className="milestone-icon">🔌</div>
                    <div className="milestone-text">
                      <h5>Backend APIs</h5>
                      <ul>
                        <li>RESTful API development (Node.js)</li>
                        <li>SharePoint integration APIs</li>
                        <li>User tracking & analytics</li>
                        <li>Error handling & logging</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Phase 3: AI/ML Integration */}
            <div className="roadmap-phase phase-current">
              <div className="phase-header">
                <div className="phase-badge phase-badge-current">Phase 3 - In Progress 🔄</div>
                <h4>AI/ML Integration & Advanced Features</h4>
                <span className="phase-date">October 2025 (Weeks 8-9)</span>
              </div>
              <div className="phase-content">
                <div className="milestone-grid">
                  <div className="milestone-item ai">
                    <div className="milestone-icon">🤖</div>
                    <div className="milestone-text">
                      <h5>AI Processing Pipeline</h5>
                      <ul>
                        <li>Azure Functions for document ingestion</li>
                        <li>GPT-4 Vision for image analysis</li>
                        <li>Dual-granularity chunking</li>
                        <li>OpenAI embeddings generation</li>
                      </ul>
                    </div>
                  </div>

                  <div className="milestone-item vector">
                    <div className="milestone-icon">🔍</div>
                    <div className="milestone-text">
                      <h5>Vector Database & RAG</h5>
                      <ul>
                        <li>Pinecone vector DB integration</li>
                        <li>Semantic search implementation</li>
                        <li>RAG chatbot with 3 modes</li>
                        <li>Multi-session conversation handling</li>
                      </ul>
                    </div>
                  </div>

                  <div className="milestone-item n8n">
                    <div className="milestone-icon">⚡</div>
                    <div className="milestone-text">
                      <h5>n8n Workflow Automation</h5>
                      <ul>
                        <li>n8n VM setup & configuration</li>
                        <li>4 AI Agent workflows deployed</li>
                        <li>Webhook integrations</li>
                        <li>Scheduled automation triggers</li>
                      </ul>
                    </div>
                  </div>

                  <div className="milestone-item agents">
                    <div className="milestone-icon">🎯</div>
                    <div className="milestone-text">
                      <h5>AI Agents Ecosystem</h5>
                      <ul>
                        <li>Transcript Analyzer Agent</li>
                        <li>Document Generation Agent</li>
                        <li>CV Screening Agent</li>
                        <li>MCQ Generator Agent</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Phase 4: Future Enhancements */}
            <div className="roadmap-phase phase-future">
              <div className="phase-header">
                <div className="phase-badge phase-badge-future">Phase 4 - Planned 📅</div>
                <h4>Future Enhancements & Scale</h4>
                <span className="phase-date">Q4 2025 & Beyond</span>
              </div>
              <div className="phase-content">
                <div className="milestone-grid-future">
                  <div className="future-item">
                    <span className="future-icon">🌐</span>
                    <span>Multi-tenant architecture</span>
                  </div>
                  <div className="future-item">
                    <span className="future-icon">📊</span>
                    <span>Advanced analytics dashboard</span>
                  </div>
                  <div className="future-item">
                    <span className="future-icon">🔗</span>
                    <span>Third-party integrations (Salesforce, Jira)</span>
                  </div>
                  <div className="future-item">
                    <span className="future-icon">🌍</span>
                    <span>Multi-language support</span>
                  </div>
                  <div className="future-item">
                    <span className="future-icon">🚀</span>
                    <span>Performance optimization & caching</span>
                  </div>
                  <div className="future-item">
                    <span className="future-icon">🔔</span>
                    <span>Real-time collaboration features</span>
                  </div>
                  <div className="future-item">
                    <span className="future-icon">📱</span>
                    <span>Mobile app development</span>
                  </div>
                  <div className="future-item">
                    <span className="future-icon">🛡️</span>
                    <span>Enhanced security & compliance (SOC 2)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Project Stats */}
          <div className="roadmap-stats">
            <div className="stat-card">
              <div className="stat-value">2</div>
              <div className="stat-label">Months Delivered</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">15+</div>
              <div className="stat-label">Core Features</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">6</div>
              <div className="stat-label">AI Agents</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">100%</div>
              <div className="stat-label">Cloud Native</div>
            </div>
          </div>
        </div>
      ),
      theme: "roadmap-journey"
    },

    // Slide 4: AI Agents Ecosystem
    {
      title: "Hyper Agentic AI System",
      subtitle: "Specialized AI Agents for Autonomous Task Execution",
      content: (
        <div className="slide-content-agents">
          <p className="agents-intro">
            Our multi-agent architecture leverages specialized AI agents that work autonomously 
            and collaboratively to handle complex research workflows with precision and intelligence.
          </p>

          <div className="agents-grid">
            <div className="agent-card">
              <div className="agent-header">
                <div className="agent-icon">📋</div>
                <h4>CV Screening Agent</h4>
              </div>
              <div className="agent-body">
                <p className="agent-description">
                  Intelligently analyzes resumes and CVs to extract key information, match skills 
                  with job requirements, and rank candidates based on qualifications.
                </p>
                <div className="agent-features">
                  <span className="feature-tag">✓ Entity Extraction</span>
                  <span className="feature-tag">✓ Skill Matching</span>
                  <span className="feature-tag">✓ Experience Analysis</span>
                  <span className="feature-tag">✓ Ranking Algorithm</span>
                </div>
              </div>
            </div>

            <div className="agent-card">
              <div className="agent-header">
                <div className="agent-icon">🎙️</div>
                <h4>Transcript Analyzer Agent</h4>
              </div>
              <div className="agent-body">
                <p className="agent-description">
                  Processes meeting transcripts, interviews, and recordings to extract insights, 
                  action items, sentiment analysis, and generate comprehensive summaries.
                </p>
                <div className="agent-features">
                  <span className="feature-tag">✓ Sentiment Analysis</span>
                  <span className="feature-tag">✓ Key Topics</span>
                  <span className="feature-tag">✓ Action Items</span>
                  <span className="feature-tag">✓ Speaker Identification</span>
                </div>
              </div>
            </div>

            <div className="agent-card">
              <div className="agent-header">
                <div className="agent-icon">📄</div>
                <h4>Document Processor Agent</h4>
              </div>
              <div className="agent-body">
                <p className="agent-description">
                  Advanced document understanding with OCR, table extraction, image analysis, 
                  and semantic chunking for optimal knowledge retrieval.
                </p>
                <div className="agent-features">
                  <span className="feature-tag">✓ Multi-format Support</span>
                  <span className="feature-tag">✓ OCR & Vision</span>
                  <span className="feature-tag">✓ Table Detection</span>
                  <span className="feature-tag">✓ Metadata Enrichment</span>
                </div>
              </div>
            </div>

            <div className="agent-card">
              <div className="agent-header">
                <div className="agent-icon">💬</div>
                <h4>RAG Chatbot Agent</h4>
              </div>
              <div className="agent-body">
                <p className="agent-description">
                  Conversational AI powered by Retrieval-Augmented Generation that provides 
                  accurate, context-aware responses grounded in your document repository.
                </p>
                <div className="agent-features">
                  <span className="feature-tag">✓ Context-Aware</span>
                  <span className="feature-tag">✓ Citation-Backed</span>
                  <span className="feature-tag">✓ Multi-Document</span>
                  <span className="feature-tag">✓ Hallucination-Free</span>
                </div>
              </div>
            </div>

            <div className="agent-card">
              <div className="agent-header">
                <div className="agent-icon">⚙️</div>
                <h4>Workflow Orchestrator Agent</h4>
              </div>
              <div className="agent-body">
                <p className="agent-description">
                  Integrates with n8n to coordinate complex workflows, trigger automated pipelines, 
                  and manage inter-agent communication for seamless task execution.
                </p>
                <div className="agent-features">
                  <span className="feature-tag">✓ n8n Integration</span>
                  <span className="feature-tag">✓ Task Scheduling</span>
                  <span className="feature-tag">✓ Agent Coordination</span>
                  <span className="feature-tag">✓ Error Handling</span>
                </div>
              </div>
            </div>

            <div className="agent-card">
              <div className="agent-header">
                <div className="agent-icon">📊</div>
                <h4>Analytics & Insights Agent</h4>
              </div>
              <div className="agent-body">
                <p className="agent-description">
                  Generates comprehensive analytics, trends, and actionable insights from your 
                  research data with automated reporting and visualization.
                </p>
                <div className="agent-features">
                  <span className="feature-tag">✓ Trend Analysis</span>
                  <span className="feature-tag">✓ Auto Reports</span>
                  <span className="feature-tag">✓ Data Visualization</span>
                  <span className="feature-tag">✓ Predictive Insights</span>
                </div>
              </div>
            </div>
          </div>

          <div className="agents-highlight">
            <p>🔥 All agents leverage <strong>GPT-4o</strong>, <strong>LangChain</strong>, and <strong>Azure AI Services</strong> for enterprise-grade performance</p>
          </div>
        </div>
      ),
      theme: "agents"
    },

    // Slide 5: Authentication & Security
    {
      title: "Enterprise Authentication",
      subtitle: "Secure Access with Azure Active Directory",
      content: (
        <div className="slide-content-feature">
          <div className="feature-overview">
            <div className="feature-icon-large">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
            </div>
            <h3>Multi-Layered Security</h3>
          </div>

          <div className="feature-benefits">
            <div className="benefit-card">
              <div className="benefit-icon">🔐</div>
              <h4>Azure AD SSO</h4>
              <p>Single sign-on with Microsoft 365 integration</p>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon">👥</div>
              <h4>Role-Based Access</h4>
              <p>Granular permissions per workspace</p>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon">🛡️</div>
              <h4>Session Management</h4>
              <p>Automatic token refresh and expiration handling</p>
            </div>
          </div>

          <div className="feature-stats">
            <div className="stat-item">
              <span className="stat-value">99.9%</span>
              <span className="stat-label">Uptime SLA</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">&lt; 2s</span>
              <span className="stat-label">Auth Response</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">100%</span>
              <span className="stat-label">Encrypted</span>
            </div>
          </div>
        </div>
      ),
      theme: "feature"
    },

    // Slide 6: Document Upload - Multi-Source
    {
      title: "Multi-Source Document Ingestion",
      subtitle: "Flexible Upload from Any Source",
      content: (
        <div className="slide-content-feature">
          <div className="upload-sources">
            <div className="source-card">
              <div className="source-header">
                <div className="source-icon">📁</div>
                <h4>Local Upload</h4>
              </div>
              <ul className="source-features">
                <li>✓ Drag & drop interface</li>
                <li>✓ PDF & DOCX support</li>
                <li>✓ 10MB max file size</li>
                <li>✓ Batch upload capability</li>
              </ul>
              <div className="source-use-case">
                <strong>Use Case:</strong> Internal documents, reports, research papers
              </div>
            </div>

            <div className="source-card">
              <div className="source-header">
                <div className="source-icon">📊</div>
                <h4>SharePoint</h4>
              </div>
              <ul className="source-features">
                <li>✓ Direct integration</li>
                <li>✓ Folder sync</li>
                <li>✓ Auto-refresh</li>
                <li>✓ Permission inheritance</li>
              </ul>
              <div className="source-use-case">
                <strong>Use Case:</strong> Company policies, shared team documents
              </div>
            </div>

            <div className="source-card">
              <div className="source-header">
                <div className="source-icon">🌐</div>
                <h4>Web Scraping</h4>
              </div>
              <ul className="source-features">
                <li>✓ URL extraction</li>
                <li>✓ JavaScript rendering</li>
                <li>✓ Clean content extraction</li>
                <li>✓ Playwright automation</li>
              </ul>
              <div className="source-use-case">
                <strong>Use Case:</strong> Industry news, competitor analysis
              </div>
            </div>
          </div>

          <div className="upload-workflow">
            <div className="workflow-step">1. Validate → </div>
            <div className="workflow-step">2. Extract → </div>
            <div className="workflow-step">3. Categorize → </div>
            <div className="workflow-step">4. Store</div>
          </div>
        </div>
      ),
      theme: "feature"
    },

    // Slide 7: Upload Process Architecture
    {
      title: "Document Upload Orchestration",
      subtitle: "End-to-End Upload Architecture - Layer 1",
      content: (
        <div className="slide-content-architecture-flow">
          <div className="architecture-flow">
            {/* Step 1: Upload Sources */}
            <div className="flow-stage">
              <div className="stage-title">Input Sources</div>
              <div className="source-options">
                <div className="source-box">
                  <div className="source-icon">📁</div>
                  <div className="source-label">Local Upload</div>
                </div>
                <div className="source-box">
                  <div className="source-icon">☁️</div>
                  <div className="source-label">SharePoint</div>
                </div>
                <div className="source-box">
                  <div className="source-icon">🌐</div>
                  <div className="source-label">Web Scrape</div>
                </div>
              </div>
            </div>

            {/* Arrow */}
            <div className="flow-arrow">→</div>

            {/* Step 2: Upload Document */}
            <div className="flow-stage">
              <div className="process-box primary">
                <div className="process-icon">📤</div>
                <div className="process-label">Upload Document</div>
              </div>
            </div>

            {/* Arrow */}
            <div className="flow-arrow">→</div>

            {/* Step 3: File Validation */}
            <div className="flow-stage">
              <div className="validation-diamond">
                <div className="diamond-content">
                  <div className="diamond-icon">✓</div>
                  <div className="diamond-label">File Validation</div>
                </div>
              </div>
              <div className="validation-rules">
                <div className="rule-badge">PDF & DOCX</div>
                <div className="rule-badge">Max 10 MB</div>
              </div>
            </div>

            {/* Validation Paths */}
            <div className="flow-split">
              {/* Success Path */}
              <div className="flow-path success-path">
                <div className="path-label success">Yes</div>
                <div className="flow-arrow-vert">→</div>
                
                <div className="process-box success">
                  <div className="process-icon">💾</div>
                  <div className="process-label">Save to Azure Blob</div>
                </div>

                <div className="flow-arrow-vert">→</div>

                <div className="process-box ai-process">
                  <div className="process-icon">🤖</div>
                  <div className="process-label">AI Categorization</div>
                  <div className="process-sublabel">GPT-4.1 Classification</div>
                </div>

                <div className="flow-arrow-vert">→</div>

                <div className="categories-box">
                  <div className="categories-title">Document Categories</div>
                  <div className="category-tags">
                    <span className="category-tag">Research Papers</span>
                    <span className="category-tag">Company Policy</span>
                    <span className="category-tag">Training Docs</span>
                    <span className="category-tag">Call Transcript</span>
                    <span className="category-tag">Other</span>
                  </div>
                </div>

                <div className="flow-arrow-vert">→</div>

                <div className="process-box final-success">
                  <div className="process-icon">✅</div>
                  <div className="process-label">Success</div>
                </div>
              </div>

              {/* Error Path */}
              <div className="flow-path error-path">
                <div className="path-label error">No</div>
                <div className="flow-arrow-vert">↓</div>
                
                <div className="process-box error">
                  <div className="process-icon">❌</div>
                  <div className="process-label">Return Error</div>
                  <div className="process-sublabel">Validation Failed</div>
                </div>
              </div>
            </div>
          </div>

          {/* Processing Note */}
          <div className="architecture-note">
            <div className="note-icon">⚙️</div>
            <div className="note-text">
              <strong>Azure Function Apps:</strong> Separate functions handle text extraction, 
              dual-granularity chunking, and vector embedding generation before Pinecone storage
            </div>
          </div>
        </div>
      ),
      theme: "architecture-flow"
    },

    // Slide 8: Document Ingestion Process - Layer 2
    {
      title: "Document Ingestion Process",
      subtitle: "AI-Powered Extraction & Embedding - Orchestration Layer 2",
      content: (
        <div className="slide-content-ingestion-layer">
          <div className="ingestion-layout">
            {/* Left: Validation Flow */}
            <div className="ingestion-validation-side">
              <div className="ingestion-start">
                <div className="start-icon">📄</div>
                <div className="start-label">Uploaded Document</div>
              </div>

              <div className="flow-connector">↓</div>

              <div className="validation-diamond small">
                <div className="diamond-content">
                  <div className="diamond-icon">✓</div>
                  <div className="diamond-label">File Validation</div>
                </div>
              </div>

              <div className="validation-branches">
                <div className="branch-yes">
                  <span className="branch-label success">Yes</span>
                  <span className="arrow-right">→</span>
                </div>
                <div className="branch-no">
                  <span className="branch-label error">No</span>
                  <div className="flow-connector">↓</div>
                  <div className="error-box-small">
                    <div className="error-icon">❌</div>
                    <div className="error-label">Return Error</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Detailed Ingestion Process */}
            <div className="ingestion-process-side">
              <div className="process-container-box">
                <div className="process-header-title">Ingestion Process</div>

                <div className="process-steps-vertical">
                  {/* Step 1 */}
                  <div className="ingestion-process-step">
                    <div className="step-box extraction-step">
                      <div className="step-icon-small">🔍</div>
                      <div className="step-details">
                        <h5>Multi-Modal Extraction</h5>
                        <ul>
                          <li>Text Extraction</li>
                          <li>Table Extraction</li>
                          <li>Image Extraction</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="step-connector">↓</div>

                  {/* Step 2 */}
                  <div className="ingestion-process-step">
                    <div className="step-box cleanup-step">
                      <div className="step-icon-small">🧹</div>
                      <div className="step-details">
                        <h5>Text Cleanup</h5>
                        <ul>
                          <li>Remove boilerplate</li>
                          <li>Remove special chars</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="step-connector">↓</div>

                  {/* Step 3 */}
                  <div className="ingestion-process-step">
                    <div className="step-box chunking-step">
                      <div className="step-icon-small">✂️</div>
                      <div className="step-details">
                        <h5>Create Chunks</h5>
                        <ul>
                          <li>Short chunks (300-500 tokens)</li>
                          <li>Long chunks (800-1000 tokens)</li>
                          <li>Overlap of 25%</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="step-connector">↓</div>

                  {/* Step 4 */}
                  <div className="ingestion-process-step">
                    <div className="step-box embedding-step">
                      <div className="step-icon-small">🧠</div>
                      <div className="step-details">
                        <h5>Create Embedding</h5>
                        <p>Using <strong>"text-embedding-3-large"</strong> model</p>
                      </div>
                    </div>
                  </div>

                  <div className="step-connector">↓</div>

                  {/* Step 5 */}
                  <div className="ingestion-process-step">
                    <div className="step-box vector-step">
                      <div className="step-icon-small">🗄️</div>
                      <div className="step-details">
                        <h5>Save to Vector DB</h5>
                        <ul>
                          <li>Save metadata & embedding to Pinecone</li>
                          <li>Using 3072 dimensions</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="step-connector">↓</div>

                  {/* Step 6 */}
                  <div className="ingestion-process-step">
                    <div className="step-box blob-step">
                      <div className="step-icon-small">☁️</div>
                      <div className="step-details">
                        <h5>Save to Azure Blob</h5>
                        <p>Long & short chunks in different folders</p>
                      </div>
                    </div>
                  </div>

                  <div className="step-connector">↓</div>

                  {/* Success */}
                  <div className="ingestion-success-box">
                    <div className="success-icon">✅</div>
                    <div className="success-label">Ingestion Success</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
      theme: "ingestion-layer"
    },

    // Slide 9: AI Processing Pipeline - Card Layout
    {
      title: "AI Processing Pipeline",
      subtitle: "Comprehensive Document Intelligence Workflow",
      content: (
        <div className="slide-content-pipeline-cards">
          <div className="pipeline-cards-grid">
            {/* Card 1 */}
            <div className="pipeline-card">
              <div className="pipeline-card-number">1</div>
              <div className="pipeline-card-icon">📥</div>
              <h4>Document Ingestion</h4>
              <p>Multi-source intake: local files, SharePoint, web URLs</p>
              <div className="card-tech-tags">
                <span>PDF</span>
                <span>DOCX</span>
                <span>Web</span>
              </div>
            </div>

            {/* Card 2 */}
            <div className="pipeline-card">
              <div className="pipeline-card-number">2</div>
              <div className="pipeline-card-icon">🔍</div>
              <h4>Multi-Modal Extraction</h4>
              <p>Advanced text, table, and image extraction with GPT-4 Vision</p>
              <div className="card-tech-tags">
                <span>PyMuPDF</span>
                <span>GPT-4V</span>
              </div>
            </div>

            {/* Card 3 */}
            <div className="pipeline-card">
              <div className="pipeline-card-number">3</div>
              <div className="pipeline-card-icon">🧹</div>
              <h4>Text Preprocessing</h4>
              <p>Intelligent cleanup removing boilerplate and normalizing text</p>
              <div className="card-tech-tags">
                <span>NLP</span>
                <span>Regex</span>
              </div>
            </div>

            {/* Card 4 */}
            <div className="pipeline-card">
              <div className="pipeline-card-number">4</div>
              <div className="pipeline-card-icon">✂️</div>
              <h4>Dual-Granularity Chunking</h4>
              <p>Strategic chunking with 25% overlap for context preservation</p>
              <div className="card-tech-tags">
                <span>300-500</span>
                <span>800-1000</span>
              </div>
            </div>

            {/* Card 5 */}
            <div className="pipeline-card">
              <div className="pipeline-card-number">5</div>
              <div className="pipeline-card-icon">🧠</div>
              <h4>Vector Embedding</h4>
              <p>High-dimensional embeddings using text-embedding-3-large</p>
              <div className="card-tech-tags">
                <span>3072-dim</span>
                <span>OpenAI</span>
              </div>
            </div>

            {/* Card 6 */}
            <div className="pipeline-card">
              <div className="pipeline-card-number">6</div>
              <div className="pipeline-card-icon">🗄️</div>
              <h4>Vector Database</h4>
              <p>Pinecone for ultra-fast semantic search and retrieval</p>
              <div className="card-tech-tags">
                <span>Pinecone</span>
                <span>Cosine</span>
              </div>
            </div>

            {/* Card 7 */}
            <div className="pipeline-card">
              <div className="pipeline-card-number">7</div>
              <div className="pipeline-card-icon">💾</div>
              <h4>Metadata Storage</h4>
              <p>Azure SQL metadata with Blob storage for raw documents</p>
              <div className="card-tech-tags">
                <span>Azure SQL</span>
                <span>Blob</span>
              </div>
            </div>

            {/* Card 8 */}
            <div className="pipeline-card">
              <div className="pipeline-card-number">8</div>
              <div className="pipeline-card-icon">🚀</div>
              <h4>RAG-Ready System</h4>
              <p>Fully indexed for intelligent retrieval-augmented generation</p>
              <div className="card-tech-tags">
                <span>GPT-4o</span>
                <span>RAG</span>
              </div>
            </div>
          </div>

          {/* Performance Stats */}
          <div className="pipeline-performance">
            <div className="perf-stat">
              <div className="perf-value">&lt; 30s</div>
              <div className="perf-label">Processing Time</div>
            </div>
            <div className="perf-stat">
              <div className="perf-value">99.8%</div>
              <div className="perf-label">Accuracy</div>
            </div>
            <div className="perf-stat">
              <div className="perf-value">3072D</div>
              <div className="perf-label">Vector Space</div>
            </div>
          </div>
        </div>
      ),
      theme: "pipeline-cards"
    },

    // Slide 10: Document Management
    {
      title: "Document Management",
      subtitle: "Organize, Search & Manage Your Knowledge Base",
      content: (
        <div className="slide-content-feature">
          <div className="feature-grid">
            <div className="feature-box">
              <div className="feature-box-icon">📂</div>
              <h4>Smart Categorization</h4>
              <p>AI automatically categorizes documents into:</p>
              <ul>
                <li>Research Papers</li>
                <li>Company Policy</li>
                <li>Training Documents</li>
                <li>Call Transcripts</li>
                <li>Custom Categories</li>
              </ul>
            </div>

            <div className="feature-box">
              <div className="feature-box-icon">🔍</div>
              <h4>Advanced Filtering</h4>
              <p>Find documents instantly with:</p>
              <ul>
                <li>Category filters</li>
                <li>Date ranges</li>
                <li>File type filters</li>
                <li>Keyword search</li>
                <li>Multi-select options</li>
              </ul>
            </div>

            <div className="feature-box">
              <div className="feature-box-icon">📊</div>
              <h4>Metadata Tracking</h4>
              <p>Comprehensive document insights:</p>
              <ul>
                <li>Upload timestamp</li>
                <li>Processing status</li>
                <li>Chunk count</li>
                <li>Keywords extracted</li>
                <li>Document summary</li>
              </ul>
            </div>

            <div className="feature-box">
              <div className="feature-box-icon">⚡</div>
              <h4>Quick Actions</h4>
              <p>Streamlined workflows:</p>
              <ul>
                <li>One-click chat</li>
                <li>Document preview</li>
                <li>Download original</li>
                <li>Delete/Archive</li>
                <li>Share with team</li>
              </ul>
            </div>
          </div>
        </div>
      ),
      theme: "feature"
    },

    // Slide 11: RAG Chatbot - Redesigned with Three Modes
    {
      title: "RAG-Powered Conversational AI",
      subtitle: "Multi-Session Intelligence with Context-Aware Responses",
      content: (
        <div className="slide-content-rag-redesign">
          {/* What is RAG Section */}
          <div className="rag-what-section">
            <h3 className="rag-what-title">What is RAG?</h3>
            <p className="rag-what-desc">
              <strong>Retrieval-Augmented Generation</strong> combines semantic search with large language models 
              to provide accurate, document-grounded responses with source citations.
            </p>
          </div>

          {/* RAG Process Flow */}
          <div className="rag-process-horizontal">
            <div className="rag-process-step">
              <div className="rag-process-num">1</div>
              <h5>User Query</h5>
              <p>Ask a natural language question</p>
            </div>
            <div className="rag-process-arrow">→</div>
            <div className="rag-process-step">
              <div className="rag-process-num">2</div>
              <h5>Semantic Search</h5>
              <p>Find relevant document chunks</p>
            </div>
            <div className="rag-process-arrow">→</div>
            <div className="rag-process-step">
              <div className="rag-process-num">3</div>
              <h5>Context Assembly</h5>
              <p>Build context from top matches</p>
            </div>
            <div className="rag-process-arrow">→</div>
            <div className="rag-process-step">
              <div className="rag-process-num">4</div>
              <h5>AI Response</h5>
              <p>Generate answer with citations</p>
            </div>
          </div>

          {/* Three Chat Modes */}
          <div className="three-modes-section">
            <h3 className="modes-title">Three Intelligent Chat Modes</h3>
            <div className="modes-container">
              <div className="mode-card workspace-mode">
                <div className="mode-card-header">
                  <div className="mode-card-icon">🏢</div>
                  <h4>1. Current Workspace</h4>
                </div>
                <div className="mode-card-body">
                  <p className="mode-desc">
                    Search across <strong>all documents</strong> in your personal workspace for comprehensive, 
                    cross-document insights and analysis.
                  </p>
                  <div className="mode-benefits">
                    <span className="benefit-badge">✓ All workspace documents</span>
                    <span className="benefit-badge">✓ Cross-document analysis</span>
                    <span className="benefit-badge">✓ Comprehensive results</span>
                  </div>
                  <div className="mode-example">
                    <strong>Business Use:</strong> "Summarize key findings across all Q4 research reports"
                  </div>
                </div>
              </div>

              <div className="mode-card pds-mode">
                <div className="mode-card-header">
                  <div className="mode-card-icon">📌</div>
                  <h4>2. PDS: Priority Document Set</h4>
                </div>
                <div className="mode-card-body">
                  <p className="mode-desc">
                    Select <strong>specific documents</strong> for targeted queries without searching entire workspace. 
                    Perfect for focused research and document comparison.
                  </p>
                  <div className="mode-benefits">
                    <span className="benefit-badge">✓ Targeted document selection</span>
                    <span className="benefit-badge">✓ Faster, precise results</span>
                    <span className="benefit-badge">✓ Reduced noise</span>
                  </div>
                  <div className="mode-example">
                    <strong>Business Use:</strong> "Compare revenue forecasts between Report A and Report B only"
                  </div>
                </div>
              </div>

              <div className="mode-card global-mode">
                <div className="mode-card-header">
                  <div className="mode-card-icon">🌍</div>
                  <h4>3. Global Chat</h4>
                </div>
                <div className="mode-card-body">
                  <p className="mode-desc">
                    External AI chatbot for <strong>general knowledge</strong> queries. Automatically activates when 
                    no relevant documents match your question.
                  </p>
                  <div className="mode-benefits">
                    <span className="benefit-badge">✓ General AI knowledge</span>
                    <span className="benefit-badge">✓ Intelligent fallback</span>
                    <span className="benefit-badge">✓ Broader context</span>
                  </div>
                  <div className="mode-example">
                    <strong>Business Use:</strong> "Explain industry best practices for project management"
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Key Business Features */}
          <div className="rag-business-features">
            <div className="business-feature">
              <div className="biz-feature-icon">💬</div>
              <h5>Unlimited Concurrent Sessions</h5>
              <p>Create multiple chat sessions simultaneously for different research topics and projects</p>
            </div>

            <div className="business-feature">
              <div className="biz-feature-icon">🎯</div>
              <h5>Context-Aware Conversations</h5>
              <p>Maintains full conversation history across questions for intelligent, contextual follow-ups</p>
            </div>

            <div className="business-feature">
              <div className="biz-feature-icon">📚</div>
              <h5>Verified Source Citations</h5>
              <p>Every answer includes page references and document sources for audit trails and verification</p>
            </div>

            <div className="business-feature">
              <div className="biz-feature-icon">🚀</div>
              <h5>Smart Fallback Mechanism</h5>
              <p>Seamlessly switches to Global Chat when no workspace documents match the query</p>
            </div>
          </div>
        </div>
      ),
      theme: "rag-redesign"
    },

    // Slide 12: AI Agents Workflow Implementation
    {
      title: "AI Agents Workflow Implementation",
      subtitle: "Automated n8n Workflows for Enterprise Intelligence",
      content: (
        <div className="slide-content-ai-agents-workflow">
          {/* Introduction */}
          <div className="workflow-intro">
            <p>
              Specialized AI agents powered by <strong>n8n workflow automation</strong> to handle 
              complex business processes autonomously, delivering measurable productivity gains and 
              operational excellence.
            </p>
          </div>

          {/* Four Agent Cards */}
          <div className="workflow-agents-grid">
            {/* Agent 1: Transcript Analyzer */}
            <div className="workflow-agent-card transcript-agent">
              <div className="workflow-agent-header">
                <div className="workflow-agent-badge">Agent 1</div>
                <div className="workflow-agent-icon">🎙️</div>
                <h4>Transcript Analyzer Agent</h4>
              </div>
              <div className="workflow-agent-body">
                <p className="workflow-agent-desc">
                  Intelligent meeting analysis that summarizes transcripts, extracts participant opinions, 
                  and generates actionable insights for better customer outcomes.
                </p>
                <div className="workflow-features-list">
                  <h5>Key Capabilities:</h5>
                  <ul>
                    <li>📝 Auto-summarizes meeting transcripts</li>
                    <li>👥 Extracts individual participant opinions</li>
                    <li>🎯 Identifies action items & decisions</li>
                    <li>💡 Generates strategic insights</li>
                  </ul>
                </div>
                <div className="workflow-tech-stack">
                  <span className="tech-pill">n8n</span>
                  <span className="tech-pill">OpenAI GPT-4</span>
                  <span className="tech-pill">NLP</span>
                </div>
                <div className="workflow-use-case">
                  <strong>Use Case:</strong> Post-meeting analysis for client calls, team retrospectives, 
                  and stakeholder meetings
                </div>
              </div>
            </div>

            {/* Agent 2: Document Generation */}
            <div className="workflow-agent-card document-agent">
              <div className="workflow-agent-header">
                <div className="workflow-agent-badge">Agent 2</div>
                <div className="workflow-agent-icon">📊</div>
                <h4>Document Generation Agent</h4>
              </div>
              <div className="workflow-agent-body">
                <p className="workflow-agent-desc">
                  Creates comprehensive insight reports by analyzing multiple documents, SOWs, and case 
                  studies to generate professional deliverables automatically.
                </p>
                <div className="workflow-features-list">
                  <h5>Key Capabilities:</h5>
                  <ul>
                    <li>📄 Multi-document analysis & synthesis</li>
                    <li>🔍 SOW-based report generation</li>
                    <li>📈 Case study insight extraction</li>
                    <li>✍️ Professional document formatting</li>
                  </ul>
                </div>
                <div className="workflow-tech-stack">
                  <span className="tech-pill">n8n</span>
                  <span className="tech-pill">GPT-4</span>
                  <span className="tech-pill">RAG</span>
                </div>
                <div className="workflow-use-case">
                  <strong>Use Case:</strong> Project proposals, executive summaries, compliance reports, 
                  and client deliverables
                </div>
              </div>
            </div>

            {/* Agent 3: CV Screening */}
            <div className="workflow-agent-card cv-agent">
              <div className="workflow-agent-header">
                <div className="workflow-agent-badge">Agent 3</div>
                <div className="workflow-agent-icon">📋</div>
                <h4>CV Screening Agent</h4>
              </div>
              <div className="workflow-agent-body">
                <p className="workflow-agent-desc">
                  HR automation that analyzes resumes from SharePoint/OneDrive, matches against job 
                  descriptions, and scores candidates (0-5) for efficient recruitment.
                </p>
                <div className="workflow-features-list">
                  <h5>Key Capabilities:</h5>
                  <ul>
                    <li>📥 Auto-fetch CVs from SharePoint/OneDrive</li>
                    <li>🎯 AI-powered JD matching</li>
                    <li>⭐ 0-5 scoring system for candidates</li>
                    <li>📊 Ranked shortlist generation</li>
                  </ul>
                </div>
                <div className="workflow-tech-stack">
                  <span className="tech-pill">n8n</span>
                  <span className="tech-pill">GPT-4</span>
                  <span className="tech-pill">SharePoint</span>
                </div>
                <div className="workflow-use-case">
                  <strong>Use Case:</strong> Bulk candidate screening, talent acquisition automation, 
                  and recruitment pipeline optimization
                </div>
              </div>
            </div>

            {/* Agent 4: MCQ Generator */}
            <div className="workflow-agent-card mcq-agent">
              <div className="workflow-agent-header">
                <div className="workflow-agent-badge">Agent 4</div>
                <div className="workflow-agent-icon">❓</div>
                <h4>MCQ Generator Agent</h4>
              </div>
              <div className="workflow-agent-body">
                <p className="workflow-agent-desc">
                  Converts any tutorial web link into comprehensive MCQ-based assessment questions for 
                  candidate screening and training evaluation.
                </p>
                <div className="workflow-features-list">
                  <h5>Key Capabilities:</h5>
                  <ul>
                    <li>🌐 Web content extraction & parsing</li>
                    <li>❓ Auto-generates MCQ questions</li>
                    <li>🎓 Multiple difficulty levels</li>
                    <li>✅ Answer key & explanations</li>
                  </ul>
                </div>
                <div className="workflow-tech-stack">
                  <span className="tech-pill">n8n</span>
                  <span className="tech-pill">GPT-4</span>
                  <span className="tech-pill">Web Scraping</span>
                </div>
                <div className="workflow-use-case">
                  <strong>Use Case:</strong> Technical assessments, training quizzes, certification prep, 
                  and skill evaluation tests
                </div>
              </div>
            </div>
          </div>

          {/* Business Impact */}
          <div className="workflow-business-impact">
            <div className="impact-stat">
              <div className="impact-value">75%</div>
              <div className="impact-label">Time Saved</div>
            </div>
            <div className="impact-stat">
              <div className="impact-value">10x</div>
              <div className="impact-label">Faster Processing</div>
            </div>
            <div className="impact-stat">
              <div className="impact-value">95%</div>
              <div className="impact-label">Accuracy</div>
            </div>
            <div className="impact-stat">
              <div className="impact-value">24/7</div>
              <div className="impact-label">Autonomous</div>
            </div>
          </div>
        </div>
      ),
      theme: "ai-agents-workflow"
    },

    // Slide 13: Use Cases
    {
      title: "Real-World Use Cases",
      subtitle: "How Organizations Use Research Hyper Agentic Assistant",
      content: (
        <div className="slide-content-use-cases">
          <div className="use-case-card">
            <div className="use-case-header">
              <div className="use-case-icon">🏢</div>
              <h4>Corporate Research</h4>
            </div>
            <div className="use-case-body">
              <p className="use-case-desc">
                Marketing team uploads competitor analysis reports, industry research, 
                and market studies. Instantly query insights across hundreds of documents.
              </p>
              <div className="use-case-metrics">
                <div className="metric">
                  <span className="metric-value">75%</span>
                  <span className="metric-label">Time Saved</span>
                </div>
                <div className="metric">
                  <span className="metric-value">500+</span>
                  <span className="metric-label">Documents</span>
                </div>
              </div>
            </div>
          </div>

          <div className="use-case-card">
            <div className="use-case-header">
              <div className="use-case-icon">📚</div>
              <h4>Academic Research</h4>
            </div>
            <div className="use-case-body">
              <p className="use-case-desc">
                Research teams organize papers, extract key findings, and discover 
                connections across studies with AI-powered semantic search.
              </p>
              <div className="use-case-metrics">
                <div className="metric">
                  <span className="metric-value">90%</span>
                  <span className="metric-label">Faster Discovery</span>
                </div>
                <div className="metric">
                  <span className="metric-value">1000+</span>
                  <span className="metric-label">Papers</span>
                </div>
              </div>
            </div>
          </div>

          <div className="use-case-card">
            <div className="use-case-header">
              <div className="use-case-icon">⚖️</div>
              <h4>Legal & Compliance</h4>
            </div>
            <div className="use-case-body">
              <p className="use-case-desc">
                Legal teams manage policies, contracts, and regulations. Quickly find 
                relevant clauses and ensure compliance with conversational queries.
              </p>
              <div className="use-case-metrics">
                <div className="metric">
                  <span className="metric-value">85%</span>
                  <span className="metric-label">Faster Review</span>
                </div>
                <div className="metric">
                  <span className="metric-value">100%</span>
                  <span className="metric-label">Audit Ready</span>
                </div>
              </div>
            </div>
          </div>

          <div className="use-case-card">
            <div className="use-case-header">
              <div className="use-case-icon">🎓</div>
              <h4>Training & Onboarding</h4>
            </div>
            <div className="use-case-body">
              <p className="use-case-desc">
                HR uploads training materials, SOPs, and handbooks. New employees 
                get instant answers to questions about company processes.
              </p>
              <div className="use-case-metrics">
                <div className="metric">
                  <span className="metric-value">60%</span>
                  <span className="metric-label">Faster Onboarding</span>
                </div>
                <div className="metric">
                  <span className="metric-value">24/7</span>
                  <span className="metric-label">Self-Service</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
      theme: "use-cases"
    },

    // Slide 14: Key Benefits
    {
      title: "Platform Benefits",
      subtitle: "Why Choose Research Hyper Agentic Assistant?",
      content: (
        <div className="slide-content-benefits">
          <div className="benefits-grid">
            <div className="benefit-item">
              <div className="benefit-header">
                <div className="benefit-number">01</div>
                <h4>Reduce Research Time by 75%</h4>
              </div>
              <p>
                Find information instantly with semantic search instead of manually 
                reading through hundreds of pages.
              </p>
            </div>

            <div className="benefit-item">
              <div className="benefit-header">
                <div className="benefit-number">02</div>
                <h4>Ensure Data Security</h4>
              </div>
              <p>
                Enterprise-grade security with Azure AD, role-based access control, 
                and workspace isolation.
              </p>
            </div>

            <div className="benefit-item">
              <div className="benefit-header">
                <div className="benefit-number">03</div>
                <h4>Scale Effortlessly</h4>
              </div>
              <p>
                Handle thousands of documents with cloud-native architecture. 
                Pay only for what you use.
              </p>
            </div>

            <div className="benefit-item">
              <div className="benefit-header">
                <div className="benefit-number">04</div>
                <h4>Accurate AI Responses</h4>
              </div>
              <p>
                RAG ensures answers are grounded in your documents with automatic 
                citation and source tracking.
              </p>
            </div>

            <div className="benefit-item">
              <div className="benefit-header">
                <div className="benefit-number">05</div>
                <h4>Multi-Source Integration</h4>
              </div>
              <p>
                Connect to SharePoint, upload local files, or scrape web content. 
                One unified knowledge base.
              </p>
            </div>

            <div className="benefit-item">
              <div className="benefit-header">
                <div className="benefit-number">06</div>
                <h4>Continuous Learning</h4>
              </div>
              <p>
                Platform improves over time with usage patterns, user feedback, 
                and model updates.
              </p>
            </div>
          </div>
        </div>
      ),
      theme: "benefits"
    },

    // Slide 15: Technical Highlights
    {
      title: "Technical Excellence",
      subtitle: "Built with Industry-Leading Technologies",
      content: (
        <div className="slide-content-tech">
          <div className="tech-category">
            <h4>🎨 Frontend</h4>
            <div className="tech-list">
              <div className="tech-item">
                <strong>React 18</strong>
                <span>Modern UI with hooks & context</span>
              </div>
              <div className="tech-item">
                <strong>Material-UI</strong>
                <span>Professional component library</span>
              </div>
              <div className="tech-item">
                <strong>Framer Motion</strong>
                <span>Smooth animations</span>
              </div>
              <div className="tech-item">
                <strong>MSAL.js</strong>
                <span>Azure AD authentication</span>
              </div>
            </div>
          </div>

          <div className="tech-category">
            <h4>⚙️ Backend</h4>
            <div className="tech-list">
              <div className="tech-item">
                <strong>Node.js + Express</strong>
                <span>High-performance API server</span>
              </div>
              <div className="tech-item">
                <strong>Azure SQL</strong>
                <span>Relational data storage</span>
              </div>
              <div className="tech-item">
                <strong>Azure Blob Storage</strong>
                <span>Document & chunk storage</span>
              </div>
              <div className="tech-item">
                <strong>JWT</strong>
                <span>Secure token-based auth</span>
              </div>
            </div>
          </div>

          <div className="tech-category">
            <h4>🤖 AI/ML</h4>
            <div className="tech-list">
              <div className="tech-item">
                <strong>Azure OpenAI</strong>
                <span>GPT-4 for chat, embeddings</span>
              </div>
              <div className="tech-item">
                <strong>Pinecone</strong>
                <span>Vector database for semantic search</span>
              </div>
              <div className="tech-item">
                <strong>Playwright</strong>
                <span>Web scraping automation</span>
              </div>
              <div className="tech-item">
                <strong>Python 3.11</strong>
                <span>Document processing pipelines</span>
              </div>
            </div>
          </div>

          <div className="tech-category">
            <h4>☁️ Infrastructure</h4>
            <div className="tech-list">
              <div className="tech-item">
                <strong>Azure Functions</strong>
                <span>Serverless compute</span>
              </div>
              <div className="tech-item">
                <strong>Azure Service Bus</strong>
                <span>Event-driven messaging</span>
              </div>
              <div className="tech-item">
                <strong>Logic Apps</strong>
                <span>Workflow orchestration</span>
              </div>
              <div className="tech-item">
                <strong>Azure DevOps</strong>
                <span>CI/CD pipelines</span>
              </div>
            </div>
          </div>
        </div>
      ),
      theme: "tech"
    },

    // Slide 16: Future Roadmap
    {
      title: "Future Roadmap",
      subtitle: "Coming Soon",
      content: (
        <div className="slide-content-roadmap">
          <div className="roadmap-timeline">
            <div className="roadmap-phase">
              <div className="phase-label">Q2 2025</div>
              <div className="phase-items">
                <div className="roadmap-item">
                  <h4>🎙️ Voice-to-Text Upload</h4>
                  <p>Upload audio recordings and transcripts automatically</p>
                </div>
                <div className="roadmap-item">
                  <h4>📊 Advanced Analytics</h4>
                  <p>Usage insights, popular queries, document engagement</p>
                </div>
              </div>
            </div>

            <div className="roadmap-phase">
              <div className="phase-label">Q3 2025</div>
              <div className="phase-items">
                <div className="roadmap-item">
                  <h4>🔗 API Integrations</h4>
                  <p>Connect to Google Drive, Dropbox, OneDrive</p>
                </div>
                <div className="roadmap-item">
                  <h4>🌍 Multi-Language Support</h4>
                  <p>Process documents in 50+ languages</p>
                </div>
              </div>
            </div>

            <div className="roadmap-phase">
              <div className="phase-label">Q4 2025</div>
              <div className="phase-items">
                <div className="roadmap-item">
                  <h4>🤝 Collaborative Features</h4>
                  <p>Team annotations, shared workspaces, comments</p>
                </div>
                <div className="roadmap-item">
                  <h4>📈 Custom ML Models</h4>
                  <p>Fine-tune models on your domain-specific data</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
      theme: "roadmap"
    },

    // Slide 17: Thank You
    {
      title: "Thank You",
      subtitle: "",
      content: (
        <div className="slide-content-thank-you">
          <div className="thank-you-content">
            <div className="thank-you-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
            <h2>Research Hyper Agentic Assistant</h2>
            <p className="tagline">Transform Your Research Workflow with AI Agents</p>

            <div className="contact-info">
              <div className="contact-item">
                <span className="contact-label">Platform:</span>
                <span className="contact-value">Research Hyper Agentic Assistant</span>
              </div>
              <div className="contact-item">
                <span className="contact-label">Technology:</span>
                <span className="contact-value">Azure OpenAI + RAG + n8n + Multi-Agent AI</span>
              </div>
              <div className="contact-item">
                <span className="contact-label">Infrastructure:</span>
                <span className="contact-value">Nitor Cloud Platform</span>
              </div>
              <div className="contact-item">
                <span className="contact-label">Status:</span>
                <span className="contact-value">Production Ready</span>
              </div>
            </div>

            <div className="cta-section">
              <h3>Ready to Experience Hyper Agentic AI?</h3>
              <p>Sign in to explore intelligent agents and automated workflows →</p>
            </div>
          </div>
        </div>
      ),
      theme: "thank-you"
    }
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  return (
    <div className="presentation-viewer">
      <div className="presentation-container">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            className={`slide slide-${slides[currentSlide].theme}`}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          >
            <div className="slide-header">
              <h1 className="slide-title">{slides[currentSlide].title}</h1>
              <p className="slide-subtitle">{slides[currentSlide].subtitle}</p>
            </div>
            <div className="slide-body">
              {slides[currentSlide].content}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation Controls */}
        <div className="presentation-controls">
          <button 
            className="nav-button prev" 
            onClick={prevSlide}
            disabled={currentSlide === 0}
          >
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          <div className="slide-indicators">
            {slides.map((_, index) => (
              <button
                key={index}
                className={`indicator ${index === currentSlide ? 'active' : ''}`}
                onClick={() => goToSlide(index)}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>

          <button 
            className="nav-button next" 
            onClick={nextSlide}
            disabled={currentSlide === slides.length - 1}
          >
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {/* Slide Counter */}
        <div className="slide-counter">
          {currentSlide + 1} / {slides.length}
        </div>
      </div>
    </div>
  );
};

export default PresentationViewer;

