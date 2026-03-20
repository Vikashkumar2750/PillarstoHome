import React, { useEffect, useState, useCallback } from 'react';
import { useTracking } from '../hooks/useTracking';
import { GoogleGenAI } from "@google/genai";
import { 
  Users, 
  PhoneMissed, 
  Eye, 
  Search, 
  Filter, 
  Phone, 
  Mail, 
  CheckCircle, 
  Activity, 
  AlertTriangle, 
  X, 
  MessageCircle, 
  MessageSquare,
  Send, 
  Trash2, 
  Calendar, 
  Shield, 
  Bell, 
  Plus, 
  UserPlus, 
  Loader2,
  Star,
  Download,
  Edit,
  ChevronRight,
  TrendingUp,
  Home,
  FileText,
  Settings,
  LogOut,
  MoreVertical,
  RefreshCw,
  Zap,
  MapPin,
  Clock,
  XCircle
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const AdminDashboard = () => {
  const { trackEvent } = useTracking();
  const [activeTab, setActiveTab] = useState('leads');
  const [leads, setLeads] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [audit, setAudit] = useState<any>(null);
  const [trends, setTrends] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [admins, setAdmins] = useState<any[]>([]);
  const [scoringWeights, setScoringWeights] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [leadTimeline, setLeadTimeline] = useState<any[]>([]);
  const [leadProperties, setLeadProperties] = useState<any[]>([]);
  const [leadInsights, setLeadInsights] = useState<any>(null);
  const [allProperties, setAllProperties] = useState<any[]>([]);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [followUpDraft, setFollowUpDraft] = useState<string | null>(null);
  const [loadingFollowUp, setLoadingFollowUp] = useState(false);
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('All');
  const [assigneeFilter, setAssigneeFilter] = useState('All');
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [showPropertyModal, setShowPropertyModal] = useState(false);
  const [editingProperty, setEditingProperty] = useState<any>(null);
  const [newProperty, setNewProperty] = useState({ title: '', price: '', location: '', type: 'Apartment', beds: 1, baths: 1, sqft: 1000, image: '', featured: false });
  const [newAdmin, setNewAdmin] = useState({ username: '', password: '', role: 'Sales Agent' });
  const role = localStorage.getItem('admin_role') || 'Admin';

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_role');
    window.location.reload();
  };

  const fetchData = useCallback(() => {
    const token = localStorage.getItem('admin_token');
    const headers = { 'Authorization': `Bearer ${token}` };
    
    const requests = [
      fetch('/api/crm/leads', { headers }).then(res => res.json()),
      fetch('/api/crm/analytics', { headers }).then(res => res.json()),
      fetch('/api/crm/lead-trends', { headers }).then(res => res.json()),
      fetch('/api/crm/notifications', { headers }).then(res => res.json()),
      fetch('/api/properties').then(res => res.json())
    ];
    
    if (role === 'Super Admin') {
      requests.push(fetch('/api/crm/audit', { headers }).then(res => res.json()));
      requests.push(fetch('/api/crm/admins', { headers }).then(res => res.json()));
      requests.push(fetch('/api/crm/settings/scoring', { headers }).then(res => res.json()));
    } else {
      requests.push(Promise.resolve(null));
      requests.push(Promise.resolve([]));
      requests.push(Promise.resolve({}));
    }
    
    Promise.all(requests).then(([leadsData, statsData, trendsData, notifsData, propsData, auditData, adminsData, scoringData]) => {
      if (leadsData.error) {
        handleLogout();
        return;
      }
      setLeads(leadsData);
      setStats(statsData);
      setTrends(trendsData);
      setNotifications(notifsData);
      setAllProperties(propsData);
      
      // Merge audit data to preserve AI recommendations
      if (auditData) {
        setAudit((prev: any) => ({
          ...auditData,
          recommendations: prev?.recommendations || [],
          issues: prev?.issues || []
        }));
      }
      
      setAdmins(adminsData);
      setScoringWeights(scoringData);
      setLoading(false);
    }).catch(() => {
      handleLogout();
    });
  }, [role]);

  useEffect(() => {
    trackEvent('page_view', 'Admin Dashboard');
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [trackEvent, fetchData]);

  useEffect(() => {
    if (activeTab === 'audit' && audit && (!audit.recommendations || audit.recommendations.length === 0)) {
      refreshAudit();
    }
  }, [activeTab, audit]);

  const updateLeadStatus = async (id: number, status: string) => {
    const token = localStorage.getItem('admin_token');
    await fetch(`/api/crm/leads/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ status })
    });
    fetchData();
  };

  const viewLeadDetails = async (id: number) => {
    const token = localStorage.getItem('admin_token');
    const res = await fetch(`/api/crm/leads/${id}`, { headers: { 'Authorization': `Bearer ${token}` } });
    const data = await res.json();
    setSelectedLead(data.lead);
    setLeadTimeline(data.events);
    setLeadProperties(data.properties || []);
    setLeadInsights(null);
  };

  const handlePropertySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('admin_token');
    const method = editingProperty ? 'PUT' : 'POST';
    const url = editingProperty ? `/api/crm/properties/${editingProperty.id}` : '/api/crm/properties';
    
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(newProperty)
    });
    
    setShowPropertyModal(false);
    setEditingProperty(null);
    setNewProperty({ title: '', price: '', location: '', type: 'Apartment', beds: 1, baths: 1, sqft: 1000, image: '', featured: false });
    fetchData();
  };

  const deleteProperty = async (id: number) => {
    if (!confirm('Are you sure you want to delete this property?')) return;
    const token = localStorage.getItem('admin_token');
    await fetch(`/api/crm/properties/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    fetchData();
  };

  const generateInsights = async (id: number) => {
    setLoadingInsights(true);
    const token = localStorage.getItem('admin_token');
    try {
      const res = await fetch(`/api/crm/leads/${id}/insights`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const prompt = `Analyze this real estate lead and provide:
        1. A 2-sentence summary of their profile and intent.
        2. 3 actionable follow-up recommendations for the sales agent.
        3. 3 specific property recommendations (from our catalog or general types) based on their budget and behavior.
        
        Lead Data: ${JSON.stringify(data.lead)}
        Engagement History: ${JSON.stringify(data.events)}
        Viewed Properties: ${JSON.stringify(data.properties)}
        
        Return the response in JSON format:
        {
          "summary": "...",
          "recommendations": ["...", "...", "..."],
          "propertySuggestions": ["...", "...", "..."]
        }`;

      const aiResponse = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

      if (aiResponse.text) {
        setLeadInsights(JSON.parse(aiResponse.text));
      }
    } catch (error) {
      console.error("Failed to generate insights", error);
    } finally {
      setLoadingInsights(false);
    }
  };

  const generateFollowUp = async (lead: any) => {
    if (!lead) return;
    setLoadingFollowUp(true);
    setShowFollowUpModal(true);
    setFollowUpDraft(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const prompt = `
        You are a luxury real estate concierge at PillarstoHome. 
        Draft a highly personalized, professional, and persuasive follow-up email/message for a lead.
        
        Lead Details:
        - Name: ${lead.name || 'Valued Client'}
        - Email: ${lead.email || 'N/A'}
        - Phone: ${lead.phone || 'N/A'}
        - Budget: ${lead.budget || 'Luxury'}
        - Intent: ${lead.intent || 'Investment/Self-use'}
        - Lead Score: ${lead.score}
        - Status: ${lead.status}
        - Source: ${lead.source}
        - Notes: ${lead.notes || 'None'}
        
        The message should:
        1. Reference their specific interest (if known from notes or intent).
        2. Offer a personalized property tour or a private consultation.
        3. Highlight PillarstoHome's exclusive inventory and AI-driven market insights.
        4. Maintain a tone of extreme luxury, discretion, and expertise.
        5. Include a clear call to action.
        
        Return ONLY the draft text.
      `;

      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt
      });
      setFollowUpDraft(result.text);
    } catch (error) {
      console.error("Error generating follow-up:", error);
      setFollowUpDraft("Failed to generate follow-up draft. Please try again.");
    } finally {
      setLoadingFollowUp(false);
    }
  };

  const recoverLead = async (id: number) => {
    const token = localStorage.getItem('admin_token');
    const res = await fetch(`/api/crm/leads/${id}/recover`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      fetchData();
    }
  };

  const deleteLead = async (id: number) => {
    const token = localStorage.getItem('admin_token');
    await fetch(`/api/crm/leads/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
    fetchData();
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || !selectedLead) return;
    
    const token = localStorage.getItem('admin_token');
    const res = await fetch(`/api/crm/leads/${selectedLead.id}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ note: newNote })
    });
    
    if (res.ok) {
      const data = await res.json();
      setSelectedLead({ ...selectedLead, notes: JSON.stringify(data.notes) });
      setNewNote('');
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('admin_token');
    const res = await fetch('/api/crm/admins', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(newAdmin)
    });
    if (res.ok) {
      setShowAddAdmin(false);
      setNewAdmin({ username: '', password: '', role: 'Sales Agent' });
      fetchData();
    }
  };

  const deleteAdmin = async (id: number) => {
    const token = localStorage.getItem('admin_token');
    await fetch(`/api/crm/admins/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
    fetchData();
  };

  const assignLead = async (leadId: number, adminId: string) => {
    const token = localStorage.getItem('admin_token');
    await fetch(`/api/crm/leads/${leadId}/assign`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ adminId: !adminId || adminId === 'None' ? null : parseInt(adminId) })
    });
    fetchData();
  };

  const updateScoringWeights = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('admin_token');
    const res = await fetch('/api/crm/settings/scoring', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(scoringWeights)
    });
    if (res.ok) {
      alert('Scoring weights updated and all lead scores recalculated.');
      fetchData();
    }
  };

  const refreshAudit = async () => {
    const token = localStorage.getItem('admin_token');
    setAudit(null);
    const res = await fetch('/api/crm/audit', { headers: { 'Authorization': `Bearer ${token}` } });
    const data = await res.json();
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const prompt = `
        As a CRM expert for a luxury real estate platform, analyze these metrics and provide 4 actionable recommendations:
        - Total Leads: ${data.totalLeads}
        - Abandoned Leads: ${data.abandonedLeads}
        - Leads missing contact info: ${data.missingContact}
        - High-intent sessions without leads: ${data.highIntentNoLeadCount}
        
        Provide recommendations as a simple JSON array of strings.
      `;
      const aiResponse = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });
      
      if (aiResponse.text) {
        data.recommendations = JSON.parse(aiResponse.text);
      } else {
        data.recommendations = [
          "Enable progressive profiling on the chatbot.",
          "A/B test the exit-intent popup on the Investment page.",
          "Implement lead scoring to prioritize high-budget investors.",
          "Follow up with 'Abandoned' leads within 2 hours for 3x conversion."
        ];
      }
    } catch (e) {
      console.error("Gemini Audit Error:", e);
      data.recommendations = [
        "Enable progressive profiling on the chatbot.",
        "A/B test the exit-intent popup on the Investment page.",
        "Implement lead scoring to prioritize high-budget investors.",
        "Follow up with 'Abandoned' leads within 2 hours for 3x conversion."
      ];
    }

    data.issues = [
      data.missingContact > 0 ? `${data.missingContact} leads are missing both email and phone.` : null,
      data.highIntentNoLeadCount > 0 ? `${data.highIntentNoLeadCount} active sessions have high engagement but no lead captured.` : null,
      data.abandonedLeads > data.totalLeads / 2 ? "More than 50% of leads are abandoned forms." : null
    ].filter(Boolean);

    setAudit(data);
  };

  const filteredLeads = (leads || []).filter(lead => {
    const matchesSearch = (lead.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (lead.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (lead.phone || '').includes(searchTerm);
    const matchesStatus = statusFilter === 'All' || lead.status === statusFilter;
    let matchesType = true;
    if (typeFilter === 'Abandoned') matchesType = lead.is_abandoned;
    if (typeFilter === 'Submitted') matchesType = !lead.is_abandoned;
    
    let matchesDate = true;
    const leadDate = new Date(lead.created_at);
    const now = new Date();
    if (dateFilter === 'Today') matchesDate = leadDate.toDateString() === now.toDateString();
    if (dateFilter === 'Week') {
      const weekAgo = new Date(now.setDate(now.getDate() - 7));
      matchesDate = leadDate >= weekAgo;
    }
    
    const matchesAssignee = assigneeFilter === 'All' || 
                            (assigneeFilter === 'None' && !lead.assigned_to) || 
                            (lead.assigned_to?.toString() === assigneeFilter);

    return matchesSearch && matchesStatus && matchesType && matchesDate && matchesAssignee;
  });

  const exportToCSV = () => {
    const headers = ['ID', 'Name', 'Email', 'Phone', 'Source', 'Status', 'Type', 'Score', 'Budget', 'Intent', 'Date'];
    const csvData = filteredLeads.map(lead => [
      lead.id,
      lead.name || 'Unknown',
      lead.email || '',
      lead.phone || '',
      lead.source || '',
      lead.status || '',
      lead.is_abandoned ? 'Abandoned' : 'Submitted',
      lead.score || 0,
      lead.budget || '',
      lead.intent || '',
      new Date(lead.created_at).toLocaleDateString()
    ]);
    
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `leads_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#050505] text-white">Loading PillarstoHome CRM...</div>;

  return (
    <div className="min-h-screen bg-[#050505] text-white p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-serif">PillarstoHome CRM Dashboard</h1>
            <p className="text-gray-400 text-sm mt-1">Enterprise Lead Tracking & Management</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm bg-white/5 px-4 py-2 rounded-full border border-white/10">
              <span className="text-gold-500 font-medium">{role}</span>
            </div>
            <div className="flex items-center gap-2 text-sm bg-white/5 px-4 py-2 rounded-full border border-white/10">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              System Active
            </div>
            <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-white transition-colors">
              Logout
            </button>
          </div>
        </header>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-white/10 mb-8">
          <button onClick={() => setActiveTab('leads')} className={`pb-3 px-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'leads' ? 'border-gold-500 text-gold-500' : 'border-transparent text-gray-400 hover:text-white'}`}>
            Lead Pipeline
          </button>
          <button onClick={() => setActiveTab('analytics')} className={`pb-3 px-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'analytics' ? 'border-gold-500 text-gold-500' : 'border-transparent text-gray-400 hover:text-white'}`}>
            Analytics
          </button>
          <button onClick={() => setActiveTab('properties')} className={`pb-3 px-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'properties' ? 'border-gold-500 text-gold-500' : 'border-transparent text-gray-400 hover:text-white'}`}>
            Properties
          </button>
          <button onClick={() => setActiveTab('notifications')} className={`pb-3 px-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'notifications' ? 'border-gold-500 text-gold-500' : 'border-transparent text-gray-400 hover:text-white'}`}>
            Notifications
            {notifications.length > 0 && (
              <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full animate-pulse">
                {notifications.length}
              </span>
            )}
          </button>
          {role === 'Super Admin' && (
            <>
              <button onClick={() => setActiveTab('audit')} className={`pb-3 px-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'audit' ? 'border-gold-500 text-gold-500' : 'border-transparent text-gray-400 hover:text-white'}`}>
                System Audit
              </button>
              <button onClick={() => setActiveTab('scoring')} className={`pb-3 px-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'scoring' ? 'border-gold-500 text-gold-500' : 'border-transparent text-gray-400 hover:text-white'}`}>
                Scoring Settings
              </button>
              <button onClick={() => setActiveTab('admins')} className={`pb-3 px-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'admins' ? 'border-gold-500 text-gold-500' : 'border-transparent text-gray-400 hover:text-white'}`}>
                User Management
              </button>
            </>
          )}
        </div>

        {activeTab === 'leads' && (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-10">
              <StatCard title="Total Leads" value={stats.totalLeads} icon={<Users />} color="text-blue-400" />
              <StatCard title="Converted" value={stats.convertedLeads} icon={<CheckCircle />} color="text-green-400" />
              <StatCard title="Abandoned Forms" value={stats.abandonedLeads} icon={<PhoneMissed />} color="text-red-400" />
              <StatCard title="Page Views" value={stats.pageViews} icon={<Eye />} color="text-purple-400" />
              <StatCard title="Conversion Rate" value={`${stats.totalLeads > 0 ? Math.round((stats.convertedLeads / stats.totalLeads) * 100) : 0}%`} icon={<Activity />} color="text-yellow-400" />
            </div>

            {/* Leads Table */}
            <div className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden">
              <div className="p-6 border-b border-white/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h2 className="text-xl font-medium">Recent Leads</h2>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                    <input 
                      type="text" 
                      placeholder="Search leads..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="bg-black border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-gold-500 w-full md:w-48" 
                    />
                  </div>
                  <select 
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-black border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gold-500 text-white"
                  >
                    <option value="All">All Statuses</option>
                    <option value="New">New</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Site Visit">Site Visit</option>
                    <option value="Negotiation">Negotiation</option>
                    <option value="Closed">Closed</option>
                    <option value="Lost">Lost</option>
                  </select>
                  <select 
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="bg-black border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gold-500 text-white"
                  >
                    <option value="All">All Types</option>
                    <option value="Submitted">Submitted</option>
                    <option value="Abandoned">Abandoned</option>
                  </select>
                  <select 
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="bg-black border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gold-500 text-white"
                  >
                    <option value="All">All Time</option>
                    <option value="Today">Today</option>
                    <option value="Week">Last 7 Days</option>
                  </select>
                  <select 
                    value={assigneeFilter}
                    onChange={(e) => setAssigneeFilter(e.target.value)}
                    className="bg-black border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gold-500 text-white"
                  >
                    <option value="All">All Assignees</option>
                    <option value="None">Unassigned</option>
                    {admins.map(a => (
                      <option key={a.id} value={a.id.toString()}>{a.username}</option>
                    ))}
                  </select>
                  <button 
                    onClick={exportToCSV}
                    className="bg-gold-500 text-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-gold-400 transition-colors"
                  >
                    Export CSV
                  </button>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-black/50 text-gray-400">
                    <tr>
                      <th className="px-6 py-4 font-medium">Name</th>
                      <th className="px-6 py-4 font-medium">Contact</th>
                      <th className="px-6 py-4 font-medium">Source</th>
                      <th className="px-6 py-4 font-medium">Score</th>
                      <th className="px-6 py-4 font-medium">Assigned To</th>
                      <th className="px-6 py-4 font-medium">Status</th>
                      <th className="px-6 py-4 font-medium">Date</th>
                      <th className="px-6 py-4 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredLeads.map((lead) => (
                      <tr key={lead.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-medium text-white">{lead.name || 'Unknown'}</div>
                          <div className="text-xs text-gray-500 font-mono mt-1">ID: {lead.session_id.substring(0,8)}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-gray-300 mb-1">
                            <Mail size={14} className="text-gray-500" /> {lead.email || '-'}
                          </div>
                          <div className="flex items-center gap-2 text-gray-300">
                            <Phone size={14} className="text-gray-500" /> {lead.phone || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-300">{lead.source}</td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <div className="w-12 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full ${lead.score > 150 ? 'bg-green-500' : lead.score > 80 ? 'bg-yellow-500' : 'bg-blue-500'}`}
                                  style={{ width: `${Math.min(100, (lead.score / 200) * 100)}%` }}
                                ></div>
                              </div>
                              <span className="text-xs font-medium text-white">{lead.score || 0}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] uppercase tracking-wider font-bold ${lead.is_abandoned ? 'text-red-400' : 'text-green-400'}`}>
                                {lead.is_abandoned ? 'Abandoned' : 'Submitted'}
                              </span>
                              {lead.score > 150 && (
                                <span className="text-[9px] bg-gold-500/20 text-gold-500 px-1 rounded font-bold uppercase">Priority</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <select 
                            value={lead.assigned_to || 'None'}
                            onChange={(e) => assignLead(lead.id, e.target.value)}
                            className="bg-black border border-white/10 rounded-md px-2 py-1 text-xs focus:outline-none focus:border-gold-500 text-white w-32"
                          >
                            <option value="None">Unassigned</option>
                            {admins.map(a => (
                              <option key={a.id} value={a.id}>{a.username}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-6 py-4">
                          <select 
                            value={lead.status}
                            onChange={(e) => updateLeadStatus(lead.id, e.target.value)}
                            className="bg-black border border-white/10 rounded-md px-2 py-1 text-xs focus:outline-none focus:border-gold-500 text-white"
                          >
                            <option value="New">New</option>
                            <option value="Contacted">Contacted</option>
                            <option value="Site Visit">Site Visit</option>
                            <option value="Negotiation">Negotiation</option>
                            <option value="Closed">Closed</option>
                            <option value="Lost">Lost</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 text-gray-400">
                          {new Date(lead.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <button onClick={() => viewLeadDetails(lead.id)} className="text-gold-500 hover:text-gold-400 text-xs font-medium">View Details</button>
                            {lead.is_abandoned && lead.status === 'New' && (
                              <button 
                                onClick={() => recoverLead(lead.id)} 
                                className="text-blue-400 hover:text-blue-300 text-xs font-medium bg-blue-500/10 px-2 py-1 rounded border border-blue-500/20"
                              >
                                Recover
                              </button>
                            )}
                            {role === 'Super Admin' && (
                              <button onClick={() => deleteLead(lead.id)} className="text-red-500 hover:text-red-400"><Trash2 size={16} /></button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              <StatCard title="Total Leads" value={stats.totalLeads} icon={<Users />} color="text-blue-400" />
              <StatCard title="Converted" value={stats.convertedLeads} icon={<CheckCircle />} color="text-green-400" />
              <StatCard title="Abandoned" value={stats.abandonedLeads} icon={<PhoneMissed />} color="text-red-400" />
              <StatCard title="Page Views" value={stats.pageViews} icon={<Eye />} color="text-purple-400" />
              <StatCard title="Conv. Rate" value={`${stats.totalLeads > 0 ? Math.round((stats.convertedLeads / stats.totalLeads) * 100) : 0}%`} icon={<Activity />} color="text-yellow-400" />
            </div>
            <div className="bg-[#111] p-8 rounded-2xl border border-white/10">
              <h3 className="text-xl font-serif mb-8">Lead Acquisition Trends</h3>
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="date" stroke="#666" fontSize={12} />
                    <YAxis stroke="#666" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                      itemStyle={{ color: '#D4AF37' }}
                    />
                    <Line type="monotone" dataKey="count" stroke="#D4AF37" strokeWidth={3} dot={{ fill: '#D4AF37' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'properties' && (
          <div className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <h2 className="text-xl font-medium">Property Inventory</h2>
              {role === 'Super Admin' && (
                <button 
                  onClick={() => {
                    setEditingProperty(null);
                    setNewProperty({ title: '', price: '', location: '', type: 'Apartment', beds: 1, baths: 1, sqft: 1000, image: '', featured: false });
                    setShowPropertyModal(true);
                  }}
                  className="bg-gold-500 text-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-gold-400 transition-colors flex items-center gap-2"
                >
                  <Plus size={16} /> Add Property
                </button>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-black/50 text-gray-400">
                  <tr>
                    <th className="px-6 py-4 font-medium uppercase tracking-wider">Property</th>
                    <th className="px-6 py-4 font-medium uppercase tracking-wider">Location</th>
                    <th className="px-6 py-4 font-medium uppercase tracking-wider">Price</th>
                    <th className="px-6 py-4 font-medium uppercase tracking-wider">Type</th>
                    <th className="px-6 py-4 font-medium uppercase tracking-wider">Stats</th>
                    <th className="px-6 py-4 font-medium uppercase tracking-wider">Featured</th>
                    {role === 'Super Admin' && <th className="px-6 py-4 font-medium uppercase tracking-wider">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {allProperties.map(prop => (
                    <tr key={prop.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img src={prop.image} alt="" className="w-10 h-10 rounded object-cover" referrerPolicy="no-referrer" />
                          <span className="font-medium">{prop.title}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-400">{prop.location}</td>
                      <td className="px-6 py-4 font-medium text-gold-500">{prop.price}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-white/5 rounded text-xs">{prop.type}</span>
                      </td>
                      <td className="px-6 py-4 text-gray-400">
                        {prop.beds}B / {prop.baths}Ba / {prop.sqft}ft²
                      </td>
                      <td className="px-6 py-4">
                        {prop.featured ? (
                          <span className="text-gold-500 flex items-center gap-1"><Star size={12} fill="currentColor" /> Yes</span>
                        ) : (
                          <span className="text-gray-600">No</span>
                        )}
                      </td>
                      {role === 'Super Admin' && (
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <button 
                              onClick={() => {
                                setEditingProperty(prop);
                                setNewProperty({ ...prop, featured: !!prop.featured });
                                setShowPropertyModal(true);
                              }}
                              className="text-blue-400 hover:text-blue-300 transition-colors"
                            >
                              Edit
                            </button>
                            <button 
                              onClick={() => deleteProperty(prop.id)}
                              className="text-red-400 hover:text-red-300 transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <h2 className="text-xl font-medium flex items-center gap-2"><Bell className="text-gold-500" size={20} /> System Notifications</h2>
            </div>
            <div className="divide-y divide-white/5">
              {notifications.map((notif) => (
                <div key={notif.id} className="p-6 hover:bg-white/[0.02] transition-colors flex items-start gap-4">
                  <div className={`p-2 rounded-lg ${notif.type === 'alert' ? 'bg-red-500/10 text-red-400' : 'bg-blue-500/10 text-blue-400'}`}>
                    {notif.type === 'alert' ? <AlertTriangle size={18} /> : <Bell size={18} />}
                  </div>
                  <div>
                    <p className="text-white">{notif.message}</p>
                    <span className="text-xs text-gray-500 mt-1 block">{new Date(notif.created_at).toLocaleString()}</span>
                  </div>
                </div>
              ))}
              {notifications.length === 0 && <div className="p-12 text-center text-gray-500">No notifications yet.</div>}
            </div>
          </div>
        )}

        {activeTab === 'admins' && role === 'Super Admin' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-medium">User Management</h2>
              <button 
                onClick={() => setShowAddAdmin(true)}
                className="bg-gold-500 text-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-gold-400 transition-colors flex items-center gap-2"
              >
                <UserPlus size={18} /> Add User
              </button>
            </div>

            <div className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-black/50 text-gray-400">
                  <tr>
                    <th className="px-6 py-4 font-medium">Username</th>
                    <th className="px-6 py-4 font-medium">Role</th>
                    <th className="px-6 py-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {admins.map((admin) => (
                    <tr key={admin.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4 text-white font-medium">{admin.username}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${admin.role === 'Super Admin' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>
                          {admin.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {admin.username !== 'admin' && (
                          <button onClick={() => deleteAdmin(admin.id)} className="text-red-500 hover:text-red-400 transition-colors">
                            <Trash2 size={18} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {showAddAdmin && (
              <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-md p-8 shadow-2xl">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-serif">Add New User</h2>
                    <button onClick={() => setShowAddAdmin(false)} className="text-gray-400 hover:text-white"><X size={20} /></button>
                  </div>
                  <form onSubmit={handleAddAdmin} className="space-y-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Username</label>
                      <input 
                        type="text" 
                        required
                        value={newAdmin.username}
                        onChange={e => setNewAdmin({...newAdmin, username: e.target.value})}
                        className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-gold-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Password</label>
                      <input 
                        type="password" 
                        required
                        value={newAdmin.password}
                        onChange={e => setNewAdmin({...newAdmin, password: e.target.value})}
                        className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-gold-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Role</label>
                      <select 
                        value={newAdmin.role}
                        onChange={e => setNewAdmin({...newAdmin, role: e.target.value})}
                        className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-gold-500"
                      >
                        <option value="Sales Agent">Sales Agent</option>
                        <option value="Super Admin">Super Admin</option>
                      </select>
                    </div>
                    <button type="submit" className="w-full bg-gold-500 text-black font-medium py-3 rounded-lg hover:bg-gold-400 transition-colors mt-4">
                      Create User
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'audit' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-[#111] p-8 rounded-2xl border border-white/10 text-center">
                {audit ? (
                  <>
                    <Activity size={48} className={`mx-auto mb-4 ${audit.healthScore > 80 ? 'text-green-500' : 'text-yellow-500'}`} />
                    <h3 className="text-gray-400 mb-2">System Health Score</h3>
                    <div className="text-6xl font-serif text-white">{audit.healthScore}%</div>
                    <button 
                      onClick={refreshAudit}
                      className="mt-6 text-xs text-gold-500 hover:text-gold-400 flex items-center gap-2 mx-auto"
                    >
                      <Activity size={14} /> Refresh Audit
                    </button>
                  </>
                ) : (
                  <div className="py-12 flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm text-gray-500 italic">Gemini is analyzing your CRM data...</p>
                  </div>
                )}
              </div>
            </div>
            <div className="lg:col-span-2 space-y-6">
              {audit && (
                <>
                  <div className="bg-[#111] p-6 rounded-2xl border border-white/10">
                    <h3 className="text-lg font-medium mb-4 flex items-center gap-2"><AlertTriangle className="text-yellow-500" size={20} /> Detected Issues</h3>
                    {audit.issues.length > 0 ? (
                      <ul className="space-y-3">
                        {audit.issues.map((issue: string, i: number) => (
                          <li key={i} className="bg-yellow-500/10 text-yellow-500 px-4 py-3 rounded-lg text-sm border border-yellow-500/20">
                            {issue}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-green-400 text-sm">No critical issues detected in the lead capture flow.</p>
                    )}
                  </div>
                  <div className="bg-[#111] p-6 rounded-2xl border border-white/10">
                    <h3 className="text-lg font-medium mb-4">AI Recommendations</h3>
                    <ul className="space-y-3">
                      {audit.recommendations.map((rec: string, i: number) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-gray-300">
                          <div className="w-1.5 h-1.5 rounded-full bg-gold-500 mt-1.5"></div>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {activeTab === 'scoring' && role === 'Super Admin' && (
          <div className="bg-[#111] border border-white/10 rounded-2xl p-8">
            <h2 className="text-2xl font-serif mb-6">Lead Scoring Configuration</h2>
            <p className="text-gray-400 mb-8 text-sm">Adjust how leads are prioritized. Higher weights mean more impact on the final score (0-200+).</p>
            
            <form onSubmit={updateScoringWeights} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="space-y-6">
                <h3 className="text-gold-500 font-medium border-b border-white/5 pb-2">Engagement Weights</h3>
                {['page_view', 'investment_page_bonus', 'listings_page_bonus', 'property_page_bonus', 'scroll_depth_multiplier', 'variety_bonus'].map(key => (
                  <div key={key}>
                    <label className="block text-xs text-gray-500 uppercase mb-1">{key.replace(/_/g, ' ')}</label>
                    <input 
                      type="number" 
                      value={scoringWeights[key] || 0}
                      onChange={e => setScoringWeights({...scoringWeights, [key]: parseInt(e.target.value)})}
                      className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-gold-500"
                    />
                  </div>
                ))}
              </div>
              
              <div className="space-y-6">
                <h3 className="text-gold-500 font-medium border-b border-white/5 pb-2">Data Quality Weights</h3>
                {['name_bonus', 'email_bonus', 'phone_bonus', 'submission_bonus'].map(key => (
                  <div key={key}>
                    <label className="block text-xs text-gray-500 uppercase mb-1">{key.replace(/_/g, ' ')}</label>
                    <input 
                      type="number" 
                      value={scoringWeights[key] || 0}
                      onChange={e => setScoringWeights({...scoringWeights, [key]: parseInt(e.target.value)})}
                      className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-gold-500"
                    />
                  </div>
                ))}
              </div>

              <div className="space-y-6">
                <h3 className="text-gold-500 font-medium border-b border-white/5 pb-2">Intent & Budget Weights</h3>
                {['intent_investment_bonus', 'intent_selfuse_bonus', 'budget_high_bonus', 'budget_mid_bonus', 'budget_low_bonus'].map(key => (
                  <div key={key}>
                    <label className="block text-xs text-gray-500 uppercase mb-1">{key.replace(/_/g, ' ')}</label>
                    <input 
                      type="number" 
                      value={scoringWeights[key] || 0}
                      onChange={e => setScoringWeights({...scoringWeights, [key]: parseInt(e.target.value)})}
                      className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-gold-500"
                    />
                  </div>
                ))}
                <div className="pt-4">
                  <button type="submit" className="w-full bg-gold-500 text-black font-medium py-3 rounded-lg hover:bg-gold-400 transition-colors">
                    Save & Recalculate All
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Property Modal */}
      {showPropertyModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden flex flex-col shadow-2xl">
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-luxury-900">
              <h2 className="text-xl font-serif">{editingProperty ? 'Edit Property' : 'Add New Property'}</h2>
              <button onClick={() => setShowPropertyModal(false)} className="text-gray-400 hover:text-white"><X size={20} /></button>
            </div>
            <form onSubmit={handlePropertySubmit} className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-xs text-gray-500 uppercase mb-1">Title</label>
                <input 
                  type="text" 
                  required
                  value={newProperty.title}
                  onChange={e => setNewProperty({...newProperty, title: e.target.value})}
                  className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-gold-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 uppercase mb-1">Price</label>
                  <input 
                    type="text" 
                    required
                    placeholder="$1,000,000"
                    value={newProperty.price}
                    onChange={e => setNewProperty({...newProperty, price: e.target.value})}
                    className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-gold-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 uppercase mb-1">Type</label>
                  <select 
                    value={newProperty.type}
                    onChange={e => setNewProperty({...newProperty, type: e.target.value})}
                    className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-gold-500"
                  >
                    <option value="Apartment">Apartment</option>
                    <option value="Villa">Villa</option>
                    <option value="Penthouse">Penthouse</option>
                    <option value="Mansion">Mansion</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 uppercase mb-1">Location</label>
                <input 
                  type="text" 
                  required
                  value={newProperty.location}
                  onChange={e => setNewProperty({...newProperty, location: e.target.value})}
                  className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-gold-500"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 uppercase mb-1">Beds</label>
                  <input 
                    type="number" 
                    required
                    value={newProperty.beds}
                    onChange={e => setNewProperty({...newProperty, beds: parseInt(e.target.value)})}
                    className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-gold-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 uppercase mb-1">Baths</label>
                  <input 
                    type="number" 
                    required
                    value={newProperty.baths}
                    onChange={e => setNewProperty({...newProperty, baths: parseInt(e.target.value)})}
                    className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-gold-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 uppercase mb-1">Sqft</label>
                  <input 
                    type="number" 
                    required
                    value={newProperty.sqft}
                    onChange={e => setNewProperty({...newProperty, sqft: parseInt(e.target.value)})}
                    className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-gold-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 uppercase mb-1">Image URL</label>
                <input 
                  type="text" 
                  required
                  value={newProperty.image}
                  onChange={e => setNewProperty({...newProperty, image: e.target.value})}
                  className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-gold-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="featured"
                  checked={newProperty.featured}
                  onChange={e => setNewProperty({...newProperty, featured: e.target.checked})}
                  className="w-4 h-4 rounded border-white/10 bg-black text-gold-500 focus:ring-gold-500"
                />
                <label htmlFor="featured" className="text-sm text-gray-400">Featured Property</label>
              </div>
              <button type="submit" className="w-full bg-gold-500 text-black font-medium py-3 rounded-lg hover:bg-gold-400 transition-colors mt-4">
                {editingProperty ? 'Update Property' : 'Add Property'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Lead Details Modal */}
      {selectedLead && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-luxury-900">
              <h2 className="text-xl font-serif">Lead Details: {selectedLead.name || 'Unknown'}</h2>
              <button onClick={() => setSelectedLead(null)} className="text-gray-400 hover:text-white"><X size={20} /></button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="space-y-8">
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-4 uppercase tracking-wider">AI Insights</h3>
                  <div className="bg-gold-500/5 border border-gold-500/20 rounded-xl p-4 space-y-4">
                    {!leadInsights ? (
                      <div className="space-y-2">
                        <button 
                          onClick={() => generateInsights(selectedLead.id)}
                          disabled={loadingInsights}
                          className="w-full py-2 bg-gold-500 text-black rounded-lg text-sm font-medium flex items-center justify-center gap-2 hover:bg-gold-400 transition-colors disabled:opacity-50"
                        >
                          {loadingInsights ? <Loader2 size={16} className="animate-spin" /> : <Activity size={16} />}
                          Generate AI Insights
                        </button>
                        <button 
                          onClick={() => generateFollowUp(selectedLead)}
                          disabled={loadingFollowUp}
                          className="w-full py-2 bg-luxury-800 text-white border border-white/10 rounded-lg text-sm font-medium flex items-center justify-center gap-2 hover:bg-luxury-700 transition-colors disabled:opacity-50"
                        >
                          {loadingFollowUp ? <Loader2 size={16} className="animate-spin" /> : <MessageSquare size={16} />}
                          AI Follow-up Draft
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-500">
                        <div>
                          <p className="text-[10px] text-gold-500 uppercase font-bold mb-1">Summary</p>
                          <p className="text-sm text-gray-200 leading-relaxed italic">"{leadInsights.summary}"</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-gold-500 uppercase font-bold mb-2">Recommendations</p>
                          <ul className="space-y-2">
                            {leadInsights.recommendations.map((rec: string, i: number) => (
                              <li key={i} className="text-xs text-gray-300 flex gap-2">
                                <span className="text-gold-500">•</span> {rec}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="text-[10px] text-gold-500 uppercase font-bold mb-2">Suggested Properties</p>
                          <ul className="space-y-2">
                            {leadInsights.propertySuggestions.map((prop: string, i: number) => (
                              <li key={i} className="text-xs text-gray-300 flex gap-2">
                                <span className="text-gold-500">→</span> {prop}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="flex justify-between items-center mt-4">
                          <button 
                            onClick={() => generateInsights(selectedLead.id)}
                            className="text-[10px] text-gray-500 hover:text-gold-500 transition-colors uppercase font-bold"
                          >
                            Regenerate
                          </button>
                          <button 
                            onClick={() => generateFollowUp(selectedLead)}
                            disabled={loadingFollowUp}
                            className="text-[10px] text-gold-500 hover:text-gold-400 transition-colors uppercase font-bold flex items-center gap-1 disabled:opacity-50"
                          >
                            {loadingFollowUp ? <Loader2 size={10} className="animate-spin" /> : <MessageSquare size={10} />}
                            AI Follow-up
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-4 uppercase tracking-wider">Contact Info</h3>
                  <div className="space-y-4 bg-black/50 p-4 rounded-xl border border-white/5">
                    <div><span className="text-gray-500 text-xs block">Email</span> {selectedLead.email || '-'}</div>
                    <div><span className="text-gray-500 text-xs block">Phone</span> {selectedLead.phone || '-'}</div>
                    <div><span className="text-gray-500 text-xs block">Source</span> {selectedLead.source}</div>
                    <div><span className="text-gray-500 text-xs block">Budget</span> {selectedLead.budget || 'Not specified'}</div>
                    <div><span className="text-gray-500 text-xs block">Intent</span> {selectedLead.intent || 'Not specified'}</div>
                    <div><span className="text-gray-500 text-xs block">Assigned To</span> 
                      <select 
                        value={selectedLead.assigned_to || ''}
                        onChange={(e) => assignLead(selectedLead.id, e.target.value)}
                        className="mt-1 w-full bg-black border border-white/10 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-gold-500"
                      >
                        <option value="">Unassigned</option>
                        {admins.map(a => (
                          <option key={a.id} value={a.id}>{a.username}</option>
                        ))}
                      </select>
                    </div>
                    <div><span className="text-gray-500 text-xs block">Lead Score</span> 
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${selectedLead.score > 150 ? 'bg-green-500' : selectedLead.score > 80 ? 'bg-yellow-500' : 'bg-blue-500'}`}
                            style={{ width: `${Math.min(100, (selectedLead.score / 200) * 100)}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-bold text-white">{selectedLead.score || 0}</span>
                      </div>
                    </div>
                    <div><span className="text-gray-500 text-xs block">Status</span> 
                      <span className={`mt-1 inline-block px-2 py-0.5 rounded text-xs ${selectedLead.is_abandoned ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                        {selectedLead.is_abandoned ? 'Abandoned Form' : 'Submitted'}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-4 uppercase tracking-wider">Communication</h3>
                  <div className="space-y-3">
                    <a 
                      href={`https://wa.me/${(selectedLead.phone || '').replace(/[^0-9]/g, '')}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 border border-[#25D366]/20 py-2.5 rounded-lg transition-colors text-sm font-medium"
                    >
                      <MessageCircle size={16} /> WhatsApp Message
                    </a>
                    <a 
                      href={`mailto:${selectedLead.email}`}
                      className="w-full flex items-center justify-center gap-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 py-2.5 rounded-lg transition-colors text-sm font-medium"
                    >
                      <Mail size={16} /> Send Email
                    </a>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-4 uppercase tracking-wider">Notes</h3>
                <div className="bg-black/50 p-4 rounded-xl border border-white/5 h-[300px] flex flex-col">
                  <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-2">
                    {selectedLead.notes ? JSON.parse(selectedLead.notes).map((note: any, i: number) => (
                      <div key={i} className="bg-luxury-800 p-3 rounded-lg text-sm border border-white/5">
                        <p className="text-gray-300">{note.text}</p>
                        <span className="text-[10px] text-gray-500 mt-2 block">{new Date(note.date).toLocaleString()}</span>
                      </div>
                    )) : (
                      <p className="text-sm text-gray-500 text-center mt-10">No notes added yet.</p>
                    )}
                  </div>
                  <form onSubmit={handleAddNote} className="relative mt-auto">
                    <input 
                      type="text" 
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Add a note..." 
                      className="w-full bg-luxury-900 border border-white/10 rounded-lg pl-3 pr-10 py-2 text-sm text-white focus:outline-none focus:border-gold-500"
                    />
                    <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-gold-500 hover:text-gold-400">
                      <Send size={16} />
                    </button>
                  </form>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-4 uppercase tracking-wider">Property Interest</h3>
                <div className="space-y-4 h-[300px] overflow-y-auto pr-2">
                  {leadProperties.map((prop) => (
                    <div key={prop.id} className="bg-black/50 p-3 rounded-lg border border-white/5 flex gap-3">
                      <img src={prop.image} alt={prop.title} className="w-16 h-16 object-cover rounded-md" referrerPolicy="no-referrer" />
                      <div>
                        <div className="text-sm font-medium text-white">{prop.title}</div>
                        <div className="text-xs text-gold-500">{prop.price}</div>
                        <div className="text-[10px] text-gray-500">{prop.location}</div>
                      </div>
                    </div>
                  ))}
                  {leadProperties.length === 0 && <p className="text-sm text-gray-500">No properties viewed yet.</p>}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-4 uppercase tracking-wider">Behavior Timeline</h3>
                <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent h-[300px] overflow-y-auto pr-2">
                  {leadTimeline.map((event, i) => (
                    <div key={event.id} className="relative flex items-center group is-active pl-6">
                      <div className="absolute left-0 w-4 h-4 rounded-full border-2 border-gold-500 bg-[#111] z-10"></div>
                      <div className="w-full bg-black/50 p-3 rounded-lg border border-white/5">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-medium text-gold-500">{event.event_type}</span>
                          <span className="text-[10px] text-gray-500">{new Date(event.created_at).toLocaleTimeString()}</span>
                        </div>
                        <div className="text-sm text-gray-300">{event.page}</div>
                        {event.data && event.data !== '{}' && (
                          <div className="text-xs text-gray-500 mt-1 font-mono bg-black p-1 rounded break-all">{event.data}</div>
                        )}
                      </div>
                    </div>
                  ))}
                  {leadTimeline.length === 0 && <p className="text-sm text-gray-500 pl-6">No behavior data recorded.</p>}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Follow-up Modal */}
      {showFollowUpModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-2xl overflow-hidden flex flex-col shadow-2xl">
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-luxury-900">
              <div className="flex items-center gap-2">
                <MessageSquare className="text-gold-500" size={20} />
                <h2 className="text-xl font-serif">AI Follow-up Draft</h2>
              </div>
              <button onClick={() => setShowFollowUpModal(false)} className="text-gray-400 hover:text-white"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              {loadingFollowUp ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <Loader2 className="animate-spin text-gold-500" size={40} />
                  <p className="text-gray-400 animate-pulse">Crafting a luxury response...</p>
                </div>
              ) : (
                <>
                  <div className="bg-black border border-white/5 rounded-xl p-6 font-serif leading-relaxed text-gray-300 whitespace-pre-wrap max-h-[400px] overflow-y-auto">
                    {followUpDraft}
                  </div>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(followUpDraft || '');
                        alert('Draft copied to clipboard!');
                      }}
                      className="flex-1 bg-luxury-800 hover:bg-luxury-700 text-white px-4 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2"
                    >
                      Copy to Clipboard
                    </button>
                    <button 
                      onClick={() => {
                        const mailto = `mailto:${selectedLead?.email}?subject=Exclusive Opportunity from PillarstoHome&body=${encodeURIComponent(followUpDraft || '')}`;
                        window.open(mailto);
                      }}
                      className="flex-1 bg-gold-500 hover:bg-gold-600 text-black px-4 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2"
                    >
                      <Mail size={18} />
                      Send via Email
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ title, value, icon, color }: { title: string, value: number | string, icon: React.ReactNode, color: string }) => (
  <div className="bg-[#111] p-6 rounded-2xl border border-white/10 relative overflow-hidden">
    <div className={`absolute right-4 top-4 opacity-20 ${color}`}>
      {React.cloneElement(icon as React.ReactElement, { size: 48 })}
    </div>
    <h3 className="text-gray-400 text-sm font-medium mb-2">{title}</h3>
    <p className="text-4xl font-serif">{value || 0}</p>
  </div>
);
