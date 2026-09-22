import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, MessageSquare, AtSign, Bell, Send, UserPlus,
  Shield, Eye, Edit, Lock, Clock, ChevronRight, X,
  CheckCircle, AlertTriangle, Tag, Filter, Settings,
  Video, Phone, Share2, Link as LinkIcon
} from 'lucide-react';

const roles = [
  { id: 'admin', label: 'Admin', color: 'red', permissions: ['read', 'write', 'delete', 'assign', 'export'] },
  { id: 'investigator', label: 'Investigator', color: 'blue', permissions: ['read', 'write', 'export'] },
  { id: 'analyst', label: 'Analyst', color: 'green', permissions: ['read', 'write'] },
  { id: 'viewer', label: 'Viewer', color: 'gray', permissions: ['read'] },
];

const CollaborationPanel = ({
  caseId,
  caseTitle,
  teamMembers = [],
  onAddMember,
  onRemoveMember,
  onUpdateRole,
  onSendMessage,
  currentUser
}) => {
  const [activeTab, setActiveTab] = useState('activity');
  const [messages, setMessages] = useState([
    { id: 1, user: 'Alex Chen', role: 'admin', message: 'Started investigating the phishing domain', time: '10 mins ago', mentions: [] },
    { id: 2, user: 'Sarah Johnson', role: 'analyst', message: '@Alex Chen I found related IPs in our threat intel database', time: '8 mins ago', mentions: ['Alex Chen'] },
    { id: 3, user: 'Mike Brown', role: 'investigator', message: 'Adding DNS records to evidence', time: '5 mins ago', mentions: [] },
    { id: 4, user: 'Alex Chen', role: 'admin', message: '@team Please review the timeline updates', time: '2 mins ago', mentions: ['team'] },
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMember, setNewMember] = useState({ email: '', role: 'viewer' });
  const [notifications, setNotifications] = useState([
    { id: 1, type: 'mention', message: 'You were mentioned by Sarah Johnson', time: '5 mins ago', read: false },
    { id: 2, type: 'update', message: 'Case status changed to In Progress', time: '1 hour ago', read: true },
    { id: 3, type: 'evidence', message: 'New evidence added by Mike Brown', time: '2 hours ago', read: true },
  ]);
  const [activityLog, setActivityLog] = useState([
    { user: 'Alex Chen', action: 'updated status', target: 'In Progress', time: '1 hour ago' },
    { user: 'Sarah Johnson', action: 'added evidence', target: 'screenshot.png', time: '2 hours ago' },
    { user: 'Mike Brown', action: 'added note', target: 'Investigation findings', time: '3 hours ago' },
    { user: 'System', action: 'assigned', target: 'Alex Chen as lead', time: '1 day ago' },
  ]);
  const messageEndRef = useRef(null);

  const defaultTeam = [
    { id: 1, name: 'Alex Chen', email: 'alex@cyber.com', role: 'admin', avatar: 'AC', online: true },
    { id: 2, name: 'Sarah Johnson', email: 'sarah@cyber.com', role: 'analyst', avatar: 'SJ', online: true },
    { id: 3, name: 'Mike Brown', email: 'mike@cyber.com', role: 'investigator', avatar: 'MB', online: false },
    { id: 4, name: 'Lisa Wang', email: 'lisa@cyber.com', role: 'viewer', avatar: 'LW', online: true },
  ];

  const team = teamMembers.length > 0 ? teamMembers : defaultTeam;

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle message send
  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const mentions = newMessage.match(/@\w+/g)?.map(m => m.slice(1)) || [];
    
    const msg = {
      id: Date.now(),
      user: currentUser?.name || 'Current User',
      role: currentUser?.role || 'analyst',
      message: newMessage,
      time: 'Just now',
      mentions
    };

    setMessages([...messages, msg]);
    setNewMessage('');
    onSendMessage?.(msg);
  };

  // Handle mention insert
  const handleMentionSelect = (name) => {
    const beforeMention = newMessage.slice(0, newMessage.lastIndexOf('@'));
    setNewMessage(`${beforeMention}@${name} `);
    setShowMentions(false);
  };

  // Handle input change with mention detection
  const handleMessageChange = (e) => {
    const value = e.target.value;
    setNewMessage(value);

    // Check for @ mention
    if (value.endsWith('@') || (value.includes('@') && !value.endsWith(' '))) {
      const lastAt = value.lastIndexOf('@');
      const search = value.slice(lastAt + 1);
      setMentionSearch(search);
      setShowMentions(true);
    } else {
      setShowMentions(false);
    }
  };

  // Filter mentions
  const filteredMembers = team.filter(m => 
    m.name.toLowerCase().includes(mentionSearch.toLowerCase())
  );

  // Add new member
  const handleAddMember = () => {
    if (!newMember.email) return;
    
    const member = {
      id: Date.now(),
      name: newMember.email.split('@')[0],
      email: newMember.email,
      role: newMember.role,
      avatar: newMember.email.substring(0, 2).toUpperCase(),
      online: false
    };

    onAddMember?.(member);
    setNewMember({ email: '', role: 'viewer' });
    setShowAddMember(false);

    // Add to activity log
    setActivityLog([
      { user: currentUser?.name || 'Current User', action: 'added member', target: member.name, time: 'Just now' },
      ...activityLog
    ]);
  };

  // Get role color
  const getRoleColor = (roleId) => {
    const role = roles.find(r => r.id === roleId);
    return role?.color || 'gray';
  };

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-800 pb-2">
        {[
          { id: 'activity', icon: Clock, label: 'Activity' },
          { id: 'chat', icon: MessageSquare, label: 'Chat' },
          { id: 'team', icon: Users, label: 'Team' },
          { id: 'notifications', icon: Bell, label: 'Alerts' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition-colors ${
              activeTab === tab.id
                ? 'bg-amber-500/20 text-amber-400 border-b-2 border-amber-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span className="text-sm">{tab.label}</span>
            {tab.id === 'notifications' && notifications.filter(n => !n.read).length > 0 && (
              <span className="w-4 h-4 rounded-full bg-red-500 text-[10px] flex items-center justify-center text-white">
                {notifications.filter(n => !n.read).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Activity Tab */}
      {activeTab === 'activity' && (
        <div className="rounded-xl bg-gray-900/50 border border-amber-500/20">
          <div className="p-4 border-b border-gray-800">
            <h3 className="font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              Recent Activity
            </h3>
          </div>
          <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
            {activityLog.map((activity, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-start gap-3 p-3 rounded-lg bg-gray-800/50"
              >
                <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs text-white">
                  {activity.user.substring(0, 2).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-300">
                    <span className="text-white font-medium">{activity.user}</span>
                    {' '}{activity.action}{' '}
                    <span className="text-amber-400">{activity.target}</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Chat Tab */}
      {activeTab === 'chat' && (
        <div className="rounded-xl bg-gray-900/50 border border-amber-500/20">
          <div className="p-4 border-b border-gray-800 flex items-center justify-between">
            <h3 className="font-bold text-white flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-amber-400" />
              Case Discussion
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">{team.filter(m => m.online).length} online</span>
              <div className="flex -space-x-2">
                {team.filter(m => m.online).slice(0, 3).map((m, i) => (
                  <div
                    key={i}
                    className="w-6 h-6 rounded-full bg-gray-700 border-2 border-gray-900 flex items-center justify-center text-[10px] text-white"
                  >
                    {m.avatar}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="p-4 space-y-4 max-h-64 overflow-y-auto">
            {messages.map((msg) => (
              <div key={msg.id} className="flex gap-3">
                <div className={`w-8 h-8 rounded-full bg-${getRoleColor(msg.role)}-500/20 flex items-center justify-center text-xs text-${getRoleColor(msg.role)}-400`}>
                  {msg.user.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-white">{msg.user}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded bg-${getRoleColor(msg.role)}-500/20 text-${getRoleColor(msg.role)}-400`}>
                      {msg.role}
                    </span>
                    <span className="text-xs text-gray-500">{msg.time}</span>
                  </div>
                  <p className="text-sm text-gray-300">
                    {msg.message.split(' ').map((word, i) => 
                      word.startsWith('@') ? (
                        <span key={i} className="text-amber-400 hover:underline cursor-pointer">{word} </span>
                      ) : `${word} `
                    )}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messageEndRef} />
          </div>

          {/* Message Input */}
          <div className="p-4 border-t border-gray-800 relative">
            {showMentions && (
              <div className="absolute bottom-full left-4 mb-2 w-48 bg-gray-800 rounded-lg border border-gray-700 shadow-xl overflow-hidden">
                {filteredMembers.length > 0 ? (
                  filteredMembers.map(member => (
                    <button
                      key={member.id}
                      onClick={() => handleMentionSelect(member.name)}
                      className="w-full px-3 py-2 text-left hover:bg-gray-700 flex items-center gap-2"
                    >
                      <div className="w-6 h-6 rounded-full bg-gray-600 flex items-center justify-center text-[10px]">
                        {member.avatar}
                      </div>
                      <span className="text-sm text-gray-300">{member.name}</span>
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-2 text-sm text-gray-500">No members found</div>
                )}
                <button
                  onClick={() => handleMentionSelect('team')}
                  className="w-full px-3 py-2 text-left hover:bg-gray-700 flex items-center gap-2 border-t border-gray-700"
                >
                  <Users className="w-4 h-4 text-amber-400" />
                  <span className="text-sm text-amber-400">@team - Notify all</span>
                </button>
              </div>
            )}
            <div className="flex gap-2">
              <button className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:text-white">
                <AtSign className="w-4 h-4" />
              </button>
              <input
                type="text"
                value={newMessage}
                onChange={handleMessageChange}
                onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type a message... Use @ to mention"
                className="flex-1 px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-sm text-gray-300 outline-none focus:border-amber-500/50"
              />
              <button
                onClick={handleSendMessage}
                disabled={!newMessage.trim()}
                className="p-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Team Tab */}
      {activeTab === 'team' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white">Team Members ({team.length})</h3>
            <button
              onClick={() => setShowAddMember(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-400 text-sm hover:bg-amber-500/30"
            >
              <UserPlus className="w-4 h-4" />
              Add Member
            </button>
          </div>

          {/* Role Legend */}
          <div className="flex flex-wrap gap-2">
            {roles.map(role => (
              <div key={role.id} className={`flex items-center gap-1.5 px-2 py-1 rounded bg-${role.color}-500/10`}>
                <div className={`w-2 h-2 rounded-full bg-${role.color}-400`} />
                <span className={`text-xs text-${role.color}-400`}>{role.label}</span>
              </div>
            ))}
          </div>

          <div className="grid gap-3">
            {team.map(member => {
              const roleConfig = roles.find(r => r.id === member.role) || roles[3];
              return (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-4 p-4 rounded-xl bg-gray-900/50 border border-amber-500/20"
                >
                  <div className="relative">
                    <div className={`w-12 h-12 rounded-full bg-${roleConfig.color}-500/20 flex items-center justify-center text-lg text-${roleConfig.color}-400`}>
                      {member.avatar}
                    </div>
                    {member.online && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-gray-900" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white font-medium">{member.name}</span>
                      {member.online ? (
                        <span className="text-[10px] text-green-400">Online</span>
                      ) : (
                        <span className="text-[10px] text-gray-500">Offline</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">{member.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={member.role}
                      onChange={e => onUpdateRole?.(member.id, e.target.value)}
                      className={`px-2 py-1 rounded text-xs bg-${roleConfig.color}-500/20 text-${roleConfig.color}-400 border-none outline-none`}
                    >
                      {roles.map(r => (
                        <option key={r.id} value={r.id}>{r.label}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => onRemoveMember?.(member.id)}
                      className="p-1.5 rounded text-gray-500 hover:text-red-400 hover:bg-red-500/10"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Permissions Table */}
          <div className="rounded-xl bg-gray-900/50 border border-amber-500/20 overflow-hidden">
            <div className="p-4 border-b border-gray-800">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-amber-400" />
                Role Permissions
              </h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="px-4 py-2 text-left text-xs text-gray-500">Permission</th>
                    {roles.map(r => (
                      <th key={r.id} className={`px-4 py-2 text-center text-xs text-${r.color}-400`}>{r.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {['Read', 'Write', 'Delete', 'Assign', 'Export'].map(perm => (
                    <tr key={perm} className="border-b border-gray-800/50">
                      <td className="px-4 py-2 text-sm text-gray-300">{perm}</td>
                      {roles.map(r => (
                        <td key={r.id} className="px-4 py-2 text-center">
                          {r.permissions.includes(perm.toLowerCase()) ? (
                            <CheckCircle className="w-4 h-4 text-green-400 mx-auto" />
                          ) : (
                            <X className="w-4 h-4 text-gray-600 mx-auto" />
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="rounded-xl bg-gray-900/50 border border-amber-500/20">
          <div className="p-4 border-b border-gray-800 flex items-center justify-between">
            <h3 className="font-bold text-white flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-400" />
              Notifications
            </h3>
            <button
              onClick={() => setNotifications(notifications.map(n => ({ ...n, read: true })))}
              className="text-xs text-amber-400 hover:underline"
            >
              Mark all as read
            </button>
          </div>
          <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
            {notifications.map(notif => (
              <div
                key={notif.id}
                className={`p-3 rounded-lg flex items-start gap-3 ${
                  notif.read ? 'bg-gray-800/30' : 'bg-amber-500/10 border border-amber-500/20'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  notif.type === 'mention' ? 'bg-blue-500/20 text-blue-400' :
                  notif.type === 'update' ? 'bg-amber-500/20 text-amber-400' :
                  'bg-green-500/20 text-green-400'
                }`}>
                  {notif.type === 'mention' ? <AtSign className="w-4 h-4" /> :
                   notif.type === 'update' ? <AlertTriangle className="w-4 h-4" /> :
                   <CheckCircle className="w-4 h-4" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-300">{notif.message}</p>
                  <p className="text-xs text-gray-500 mt-1">{notif.time}</p>
                </div>
                {!notif.read && (
                  <div className="w-2 h-2 rounded-full bg-amber-400" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      <AnimatePresence>
        {showAddMember && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowAddMember(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md bg-gray-900 rounded-xl border border-amber-500/30"
            >
              <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                <h3 className="font-bold text-white">Add Team Member</h3>
                <button onClick={() => setShowAddMember(false)} className="text-gray-500 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Email Address</label>
                  <input
                    type="email"
                    value={newMember.email}
                    onChange={e => setNewMember({ ...newMember, email: e.target.value })}
                    placeholder="member@company.com"
                    className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm outline-none focus:border-amber-500/50"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Role</label>
                  <div className="grid grid-cols-2 gap-2">
                    {roles.map(role => (
                      <button
                        key={role.id}
                        onClick={() => setNewMember({ ...newMember, role: role.id })}
                        className={`p-3 rounded-lg border transition-colors ${
                          newMember.role === role.id
                            ? `bg-${role.color}-500/20 border-${role.color}-500/50`
                            : 'bg-gray-800 border-gray-700 hover:bg-gray-700'
                        }`}
                      >
                        <div className={`text-sm font-medium text-${role.color}-400`}>{role.label}</div>
                        <div className="text-[10px] text-gray-500 mt-1">
                          {role.permissions.join(', ')}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="p-4 border-t border-gray-800 flex gap-3">
                <button
                  onClick={() => setShowAddMember(false)}
                  className="flex-1 py-2 rounded-lg border border-gray-700 text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddMember}
                  disabled={!newMember.email}
                  className="flex-1 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold disabled:opacity-50"
                >
                  Send Invite
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CollaborationPanel;
