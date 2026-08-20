// Tenant messages screen 
import { useState, useEffect, useCallback, useRef } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, SafeAreaView, StatusBar, RefreshControl,
  ActivityIndicator, KeyboardAvoidingView, Platform, Alert,
  Linking, Modal, Keyboard, Image,
} from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import api from "../../utils/api";
import { C, F } from "../../styles/theme";

function initials(name = "") {
  return (name || "").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
}

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 7 * 86400) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString("en-ZA", { day: "2-digit", month: "short" });
}

function formatDateHeader(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  if (date > new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7)) return "This Week";
  return date.toLocaleDateString("en-ZA", { day: "2-digit", month: "long", year: "numeric" });
}

function formatFileSize(bytes) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const QUICK_REPLIES = [
  "Thank you!",
  "I'll be available then.",
  "Please send the invoice.",
  "What time works best?",
  "Got it, thanks for the update.",
];

function ConversationItem({ convo, onPress }) {
  return (
    <TouchableOpacity style={S.convoItem} onPress={onPress} activeOpacity={0.7}>
      <View>
        <View style={S.convoAvatar}>
          <Text style={S.convoAvatarText}>
            {convo.with_initials || initials(convo.with_name)}
          </Text>
        </View>
        {convo.online && <View style={S.onlineDot} />}
      </View>
      <View style={S.convoContent}>
        <View style={S.convoHeader}>
          <Text style={[S.convoName, convo.unread > 0 && S.convoNameUnread]} numberOfLines={1}>
            {convo.with_name}
          </Text>
          <Text style={S.convoTime}>{timeAgo(convo.last_message_at)}</Text>
        </View>
        <View style={S.convoFooter}>
          <Text
            style={[S.convoPreview, convo.unread > 0 && S.convoPreviewUnread]}
            numberOfLines={1}
          >
            {convo.last_message || convo.preview || (convo.last_message_at ? "📎 Attachment" : "No messages yet")}
          </Text>
        </View>
      </View>
      {convo.unread > 0 && (
        <View style={S.unreadBadge}>
          <Text style={S.unreadBadgeText}>{convo.unread}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

function ChatBubble({ message, isMine }) {
  const hasAttachments = (message.attachments || []).length > 0;
  const hasText = !!(message.message || message.body);
  const [fullScreenImage, setFullScreenImage] = useState(null);

  function handleAttachmentPress(att) {
    const fullUrl = att.url?.startsWith("http") ? att.url : `${api.getBaseUrl()}${att.url}`;

    if (att.mime_type?.startsWith("image/")) {
      setFullScreenImage(fullUrl);
    } else if (att.url) {
      Linking.openURL(fullUrl).catch(() => Alert.alert("Error", "Could not open file."));
    }
  }

  return (
    <>
      <View style={[S.bubbleRow, isMine && S.bubbleRowMine]}>
        {/* Text message */}
        {hasText && (
          <View style={[S.bubble, isMine ? S.bubbleMine : S.bubbleTheirs]}>
            <Text style={[S.bubbleText, isMine && S.bubbleTextMine]}>
              {message.message || message.body || ""}
            </Text>
          </View>
        )}

        {/* Attachments */}
        {hasAttachments && (
          <View style={[hasText && { marginTop: 6 }]}>
            {(message.attachments || []).map((att, i) => {
              const isImage = att.mime_type?.startsWith("image/");
              const fullUrl = att.url?.startsWith("http") ? att.url : `${api.getBaseUrl()}${att.url}`;

              if (isImage) {
                return (
                  <TouchableOpacity
                    key={att.id || i}
                    onPress={() => handleAttachmentPress(att)}
                    activeOpacity={0.8}
                    style={{ marginBottom: 4 }}
                  >
                    <Image
                      source={{ uri: fullUrl }}
                      style={{
                        width: 200,
                        height: 180,
                        borderRadius: 10,
                        borderBottomLeftRadius: isMine ? 10 : 3,
                        borderBottomRightRadius: isMine ? 3 : 10,
                      }}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                );
              }

              return (
                <TouchableOpacity
                  key={att.id || i}
                  style={[
                    S.attachmentItem,
                    isMine ? S.attachmentItemMine : S.attachmentItemTheirs,
                  ]}
                  onPress={() => handleAttachmentPress(att)}
                  activeOpacity={0.7}
                >
                  {att.mime_type?.includes("pdf") ? (
                    <Ionicons name="document-text-outline" size={22} color={C.red} />
                  ) : (
                    <Ionicons name="document-outline" size={22} color={C.textMuted} />
                  )}
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <Text style={S.attachmentName} numberOfLines={2}>
                      {att.name || "Attachment"}
                    </Text>
                    {att.file_size ? (
                      <Text style={S.attachmentSize}>
                        {formatFileSize(att.file_size)}
                      </Text>
                    ) : null}
                  </View>
                  <View style={[S.attDownloadBtn, isMine ? S.attDownloadMine : S.attDownloadTheirs]}>
                    <Ionicons name="arrow-down-circle-outline" size={16} color={isMine ? C.primary : C.blue} />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Timestamp + read receipt */}
        <View style={[S.bubbleMeta, isMine && S.bubbleMetaMine]}>
          <Text style={S.bubbleTime}>{timeAgo(message.created_at)}</Text>
          {isMine && message.read && (
            <Ionicons name="checkmark-done" size={12} color={C.green} style={{ marginLeft: 4 }} />
          )}
          {isMine && !message.read && (
            <Ionicons name="checkmark" size={12} color={C.textMuted} style={{ marginLeft: 4 }} />
          )}
        </View>
      </View>

      {/* Full screen image modal */}
      <Modal visible={!!fullScreenImage} transparent animationType="fade" onRequestClose={() => setFullScreenImage(null)}>
        <View style={{
          flex: 1, backgroundColor: "rgba(0,0,0,0.9)",
          justifyContent: "center", alignItems: "center",
        }}>
          <TouchableOpacity
            style={{ position: "absolute", top: 50, right: 20, zIndex: 10, padding: 10 }}
            onPress={() => setFullScreenImage(null)}
          >
            <Ionicons name="close-circle" size={32} color="#ffffff" />
          </TouchableOpacity>

          {fullScreenImage && (
            <Image
              source={{ uri: fullScreenImage }}
              style={{ width: "100%", height: "70%" }}
              resizeMode="contain"
            />
          )}

          <View style={{ flexDirection: "row", gap: 12, marginTop: 20 }}>
            <TouchableOpacity
              style={{
                flex: 1,
                paddingHorizontal: 20, paddingVertical: 12,
                backgroundColor: C.primary, borderRadius: 8,
                alignItems: "center", justifyContent: "center",
              }}
              onPress={() => {
                if (fullScreenImage) Linking.openURL(fullScreenImage);
                setFullScreenImage(null);
              }}
            >
              <Text style={{ color: "#ffffff", fontWeight: "700", fontFamily: F.dm }}>Open Full Size</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                flex: 1,
                paddingHorizontal: 20, paddingVertical: 12,
                backgroundColor: "transparent", borderRadius: 8,
                borderWidth: 1, borderColor: C.border,
                alignItems: "center", justifyContent: "center",
              }}
              onPress={() => setFullScreenImage(null)}
            >
              <Text style={{ color: C.textPrimary, fontWeight: "600", fontFamily: F.dm }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

function NewMessageModal({ visible, onClose, onSend, recipients }) {
  const [selectedId, setSelectedId] = useState("");
  const [msg, setMsg] = useState("");
  const [sending, setSending] = useState(false);

  function handleClose() {
    setMsg("");
    setSelectedId("");
    onClose();
  }

  async function handleSend() {
    if (!selectedId || !msg.trim()) return;
    setSending(true);
    try {
      await onSend(selectedId, msg.trim());
      setMsg("");
      setSelectedId("");
      onClose();
    } catch {
      Alert.alert("Error", "Failed to send message. Please try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={S.modalOverlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ width: "100%" }}
        >
          <View style={S.modalCard}>
            <View style={S.modalHeader}>
              <Text style={S.modalTitle}>New Message</Text>
              <TouchableOpacity onPress={handleClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close" size={22} color={C.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={S.modalLabel}>TO</Text>
            <ScrollView style={{ maxHeight: 160, marginBottom: 16 }} keyboardShouldPersistTaps="handled">
              {recipients.map(r => (
                <TouchableOpacity
                  key={r.user_id}
                  style={[S.recipientItem, selectedId === r.user_id && S.recipientItemActive]}
                  onPress={() => setSelectedId(r.user_id)}
                  activeOpacity={0.7}
                >
                  <View style={[S.recipientAvatar, selectedId === r.user_id && S.recipientAvatarActive]}>
                    <Text style={[S.recipientAvatarText, selectedId === r.user_id && { color: C.primary }]}>
                      {initials(r.name)}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={S.recipientName}>{r.name}</Text>
                    <Text style={S.recipientRole}>
                      {r.role}{r.property ? ` · ${r.property}` : ""}
                    </Text>
                  </View>
                  {selectedId === r.user_id && (
                    <Ionicons name="checkmark-circle" size={20} color={C.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={S.modalLabel}>MESSAGE</Text>
            <TextInput
              style={S.modalInput}
              value={msg}
              onChangeText={setMsg}
              placeholder="Type your message..."
              placeholderTextColor={C.textMuted}
              multiline
              maxLength={500}
              textAlignVertical="top"
            />

            <TouchableOpacity
              style={[S.modalSendBtn, (!selectedId || !msg.trim()) && { opacity: 0.4 }]}
              onPress={handleSend}
              disabled={!selectedId || !msg.trim() || sending}
              activeOpacity={0.8}
            >
              {sending ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={S.modalSendText}>Send Message</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

export default function MessagesScreen() {
  const tabBarHeight = useBottomTabBarHeight();
  const [conversations, setConversations]   = useState([]);
  const [activeConvo, setActiveConvo]       = useState(null);
  const [messageInput, setMessageInput]     = useState("");
  const [loading, setLoading]               = useState(true);
  const [refreshing, setRefreshing]         = useState(false);
  const [sending, setSending]               = useState(false);
  const [attachments, setAttachments]       = useState([]);
  const [showNewMsg, setShowNewMsg]         = useState(false);
  const [recipients, setRecipients]         = useState([]);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const messagesRef = useRef(null);
  const [showJumpToBottom, setShowJumpToBottom] = useState(false);

  useEffect(() => {
    const show = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      e => setKeyboardHeight(e.endCoordinates.height)
    );
    const hide = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => setKeyboardHeight(0)
    );
    return () => { show.remove(); hide.remove(); };
  }, []);

  useEffect(() => {
    if (activeConvo && messagesRef.current) {
      setTimeout(() => messagesRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [keyboardHeight, activeConvo?.messages?.length]);

  const fetchConversations = useCallback(async (keepActive = false) => {
    try {
      const [convData, recipData] = await Promise.all([
        api.getConversations(),
        api.get("/messages/recipients"),
      ]);
      const convos = (convData.conversations || []).map(c => ({
        ...c,
        with_initials:  initials(c.with_name),
        unread:         c.unread_count || c.unread || 0,
        last_message:   c.last_message || c.preview || (c.last_attachment_name ? `📎 ${c.last_attachment_name}` : ""),
        online:         c.with_online || false,
        messages: (c.messages || []).map(m => ({
          id:          m.id,
          sender_id:   m.is_mine ? "me" : "them",
          message:     m.message || m.body || "",
          created_at:  m.created_at,
          read:        m.read || false,
          attachments: (m.attachments || []).map(a => ({
            id:        a.id,
            name:      a.name || a.document_name || "File",
            mime_type: a.mime_type || "application/octet-stream",
            file_size: a.file_size || 0,
            url:       a.url || a.document_url || "",
          })),
        })),
      }));
      setConversations(convos);
      setRecipients(recipData.recipients || []);
      if (keepActive && activeConvo) {
        const updated = convos.find(c => c.id === activeConvo.id);
        if (updated) setActiveConvo(updated);
      }
    } catch (err) {
      console.error("Fetch messages:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeConvo]);

  useEffect(() => { fetchConversations(); }, []);

  function onRefresh() { setRefreshing(true); fetchConversations(false); }

  async function openConvo(convo) {
    setConversations(prev =>
      prev.map(c => c.id === convo.id ? { ...c, unread: 0 } : c)
    );
    setActiveConvo({ ...convo, unread: 0 });
    try { await api.markConversationRead(convo.id); } catch {}
  }

  function closeConvo() {
    setActiveConvo(null);
    setAttachments([]);
    setMessageInput("");
    fetchConversations(false);
  }

  async function handleNewMessage(recipientId, message) {
    await api.post("/messages", { recipient_id: recipientId, message });
    await fetchConversations(false);
  }

  async function pickFile() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/*"],
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets?.length > 0) {
        const file = result.assets[0];
        if (file.size && file.size > 5 * 1024 * 1024) {
          Alert.alert("File Too Large", "Please select a file under 5 MB.");
          return;
        }
        setAttachments(prev => [...prev, file]);
      }
    } catch {
      Alert.alert("Error", "Failed to select file.");
    }
  }

  async function handleSend() {
    const text = messageInput.trim();
    if ((!text && attachments.length === 0) || !activeConvo || sending) return;

    const tempId  = `temp-${Date.now()}`;
    const newMsg  = {
      id:          tempId,
      sender_id:   "me",
      message:     text,
      created_at:  new Date().toISOString(),
      read:        false,
      attachments: attachments.map((f, i) => ({
        id:        `temp-att-${i}`,
        name:      f.name,
        mime_type: f.mimeType || f.type || "application/octet-stream",
        file_size: f.size || 0,
      })),
    };
    const updatedConvo = {
      ...activeConvo,
      messages:        [...(activeConvo.messages || []), newMsg],
      last_message:    attachments.length > 0 && !text ? "📎 Attachment" : text,
      last_message_at: new Date().toISOString(),
      unread:          0,
    };
    setConversations(prev =>
      prev.map(c => c.id === activeConvo.id ? updatedConvo : c)
    );
    setActiveConvo(updatedConvo);
    setMessageInput("");
    setAttachments([]);
    setSending(true);

    try {
      if (attachments.length > 0) {
        const formData = new FormData();
        formData.append("message", text || "");
        attachments.forEach(file =>
          formData.append("attachments", {
            uri:  file.uri,
            name: file.name,
            type: file.mimeType || file.type || "application/octet-stream",
          })
        );
        await api.replyWithAttachments(activeConvo.id, formData);
      } else {
        await api.replyToConversation(activeConvo.id, text);
      }
      await fetchConversations(true);
    } catch (err) {
      console.error("Send message:", err);
    } finally {
      setSending(false);
    }
  }

  function handleQuickReply(text) { setMessageInput(text); }

  function handleScroll(e) {
    const { contentOffset, layoutMeasurement, contentSize } = e.nativeEvent;
    const isNearBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 50;
    setShowJumpToBottom(!isNearBottom);
  }

  function scrollToBottom() {
    messagesRef.current?.scrollToEnd({ animated: true });
    setShowJumpToBottom(false);
  }

  const unreadTotal = conversations.reduce((sum, c) => sum + (c.unread || 0), 0);
  const canSend     = (messageInput.trim().length > 0 || attachments.length > 0) && !sending;

  // Group active convo messages by date
  const messageGroups = activeConvo?.messages?.reduce((groups, msg) => {
    const dateHeader = formatDateHeader(msg.created_at);
    if (!groups[dateHeader]) groups[dateHeader] = [];
    groups[dateHeader].push(msg);
    return groups;
  }, {}) || {};

  if (!activeConvo) {
    return (
      <SafeAreaView style={S.safe}>
        <StatusBar barStyle="dark-content" backgroundColor={C.surface} />
        <View style={S.header}>
          <View style={{ flex: 1 }}>
            <Text style={S.headerTitle}>Messages</Text>
            <Text style={S.headerSub}>
              {conversations.length} conversation{conversations.length !== 1 ? "s" : ""}
              {unreadTotal > 0 ? ` · ${unreadTotal} unread` : ""}
            </Text>
          </View>
          <TouchableOpacity style={S.newMsgBtn} onPress={() => setShowNewMsg(true)} activeOpacity={0.7}>
            <Ionicons name="create-outline" size={18} color={C.primary} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={S.loader}><ActivityIndicator size="large" color={C.primary} /></View>
        ) : conversations.length === 0 ? (
          <View style={S.emptyState}>
            <View style={S.emptyIcon}>
              <Ionicons name="chatbubbles-outline" size={40} color={C.textMuted} />
            </View>
            <Text style={S.emptyTitle}>No messages yet</Text>
            <Text style={S.emptySub}>
              Messages from your landlord{"\n"}and caretaker will appear here
            </Text>
            <TouchableOpacity style={S.emptyBtn} onPress={() => setShowNewMsg(true)} activeOpacity={0.8}>
              <Text style={S.emptyBtnText}>Start a Conversation</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView
            style={S.scroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />
            }
          >
            {conversations.map(convo => (
              <ConversationItem key={convo.id} convo={convo} onPress={() => openConvo(convo)} />
            ))}
            <View style={{ height: tabBarHeight + 24 }} />
          </ScrollView>
        )}

        <NewMessageModal
          visible={showNewMsg}
          onClose={() => setShowNewMsg(false)}
          onSend={handleNewMessage}
          recipients={recipients}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={S.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.surface} />
      <View style={{ flex: 1 }}>
        {/* Chat header */}
        <View style={S.chatHeader}>
          <TouchableOpacity onPress={closeConvo} style={S.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Feather name="arrow-left" size={20} color={C.textPrimary} />
          </TouchableOpacity>
          <View style={S.chatHeaderInfo}>
            <View>
              <View style={S.chatAvatar}>
                <Text style={S.chatAvatarText}>
                  {activeConvo.with_initials || initials(activeConvo.with_name)}
                </Text>
              </View>
              {activeConvo.online && <View style={S.onlineDotSmall} />}
            </View>
            <View>
              <Text style={S.chatName}>{activeConvo.with_name}</Text>
              <Text style={S.chatRole}>
                {activeConvo.online ? "Online" : "Offline"} · {activeConvo.with_role}
              </Text>
            </View>
          </View>
        </View>

        {/* Messages scroll */}
        <ScrollView
          ref={messagesRef}
          style={S.messagesScroll}
          contentContainerStyle={S.messagesPad}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          onContentSizeChange={() => {
            if (!showJumpToBottom) messagesRef.current?.scrollToEnd({ animated: false });
          }}
          onScroll={handleScroll}
          scrollEventThrottle={100}
        >
          {Object.entries(messageGroups).map(([dateHeader, msgs]) => (
            <View key={dateHeader}>
              {/* Date header */}
              <View style={S.dateDivider}>
                <View style={S.dateLine} />
                <Text style={S.dateText}>{dateHeader}</Text>
                <View style={S.dateLine} />
              </View>
              {msgs.map(msg => (
                <ChatBubble key={msg.id} message={msg} isMine={msg.sender_id === "me"} />
              ))}
            </View>
          ))}
          <View style={{ height: 16 }} />
        </ScrollView>

        {/* Jump to bottom */}
        {showJumpToBottom && (
          <TouchableOpacity style={S.jumpBtn} onPress={scrollToBottom} activeOpacity={0.8}>
            <Ionicons name="arrow-down" size={18} color="#ffffff" />
          </TouchableOpacity>
        )}

        {/* Quick replies */}
        {keyboardHeight === 0 && (
          <View style={S.quickRepliesBar}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={S.quickRepliesContent}
              keyboardShouldPersistTaps="always"
            >
              {QUICK_REPLIES.map((qr, i) => (
                <TouchableOpacity
                  key={i}
                  style={S.quickReplyChip}
                  onPress={() => handleQuickReply(qr)}
                  activeOpacity={0.7}
                >
                  <Text style={S.quickReplyText}>{qr}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Attachment previews */}
        {attachments.length > 0 && (
          <View style={S.attachmentsPreview}>
            {attachments.map((file, i) => (
              <View key={i} style={S.attachmentPreviewItem}>
                <Ionicons
                  name={file.mimeType?.startsWith("image/") ? "image" : "document"}
                  size={14}
                  color={C.blue}
                />
                <Text style={S.attachmentPreviewName} numberOfLines={1}>{file.name}</Text>
                <Text style={S.attachmentPreviewSize}>{formatFileSize(file.size)}</Text>
                <TouchableOpacity
                  onPress={() => setAttachments(prev => prev.filter((_, j) => j !== i))}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  <Ionicons name="close-circle" size={16} color={C.textMuted} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Input bar */}
        <View
          style={[
            S.inputBar,
            {
              paddingBottom:
                keyboardHeight > 0
                  ? keyboardHeight
                  : tabBarHeight + 10,
            },
          ]}
        >
          <View style={S.inputRow}>
            <TouchableOpacity style={S.attachBtn} onPress={pickFile} activeOpacity={0.7}>
              <Ionicons name="attach" size={20} color={C.textMuted} />
            </TouchableOpacity>

            <TextInput
              style={S.messageInput}
              value={messageInput}
              onChangeText={setMessageInput}
              placeholder="Type a message..."
              placeholderTextColor={C.textMuted}
              multiline
              maxLength={500}
              returnKeyType="default"
              blurOnSubmit={false}
              onSubmitEditing={() => {}}
            />

            <TouchableOpacity
              style={[S.sendBtn, !canSend && S.sendBtnDisabled]}
              onPress={handleSend}
              disabled={!canSend}
              activeOpacity={0.8}
            >
              {sending ? (
                <ActivityIndicator size="small" color={canSend ? "#ffffff" : C.textMuted} />
              ) : (
                <Ionicons
                  name="send"
                  size={16}
                  color={canSend ? "#ffffff" : C.textMuted}
                />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.background },

  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingTop: 14, paddingBottom: 12,
    backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  headerTitle: { fontSize: 22, fontWeight: "700", color: C.textPrimary, fontFamily: F.bebas, letterSpacing: 1 },
  headerSub: { fontSize: 11, color: C.textMuted, fontFamily: F.mono, marginTop: 2 },
  newMsgBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "rgba(44,62,80,0.08)", borderWidth: 1, borderColor: C.border,
    alignItems: "center", justifyContent: "center",
  },

  loader: { flex: 1, alignItems: "center", justifyContent: "center" },
  scroll: { flex: 1 },

  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 40 },
  emptyIcon: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: C.card,
    borderWidth: 1, borderColor: C.border, alignItems: "center", justifyContent: "center", marginBottom: 12,
  },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: C.textSecondary, fontFamily: F.bebas, letterSpacing: 1, marginBottom: 4 },
  emptySub: { fontSize: 12, color: C.textMuted, fontFamily: F.mono, textAlign: "center", lineHeight: 18, marginBottom: 16 },
  emptyBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, backgroundColor: C.primary },
  emptyBtnText: { fontSize: 12, fontWeight: "700", color: "#ffffff", fontFamily: F.dm },

  convoItem: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 16, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  convoAvatar: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: "rgba(44,62,80,0.1)", borderWidth: 1.5, borderColor: C.border,
    alignItems: "center", justifyContent: "center",
  },
  convoAvatarText: { color: C.primary, fontSize: 17, fontWeight: "700", fontFamily: F.bebas },
  onlineDot: {
    position: "absolute", bottom: 2, right: 2,
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: C.green, borderWidth: 2, borderColor: C.background,
  },
  convoContent: { flex: 1, minWidth: 0 },
  convoHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  convoName: { fontSize: 15, fontWeight: "600", color: C.textPrimary, fontFamily: F.dm, flex: 1, marginRight: 8 },
  convoNameUnread: { fontWeight: "700" },
  convoTime: { fontSize: 10, color: C.textMuted, fontFamily: F.mono },
  convoFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  convoPreview: { fontSize: 13, color: C.textMuted, fontFamily: F.dm, flex: 1, marginRight: 8 },
  convoPreviewUnread: { color: C.textPrimary, fontWeight: "500" },
  unreadBadge: {
    minWidth: 22, height: 22, borderRadius: 11, backgroundColor: C.primary,
    alignItems: "center", justifyContent: "center", paddingHorizontal: 6,
  },
  unreadBadgeText: { color: "#ffffff", fontSize: 11, fontWeight: "700", fontFamily: F.mono },

  chatHeader: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  backBtn: { padding: 4 },
  chatHeaderInfo: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  chatAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "rgba(44,62,80,0.1)", borderWidth: 1.5, borderColor: C.border,
    alignItems: "center", justifyContent: "center",
  },
  chatAvatarText: { color: C.primary, fontSize: 14, fontWeight: "700", fontFamily: F.bebas },
  onlineDotSmall: {
    position: "absolute", bottom: 0, right: 0,
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: C.green, borderWidth: 2, borderColor: C.surface,
  },
  chatName: { fontSize: 15, fontWeight: "600", color: C.textPrimary, fontFamily: F.dm },
  chatRole: { fontSize: 11, color: C.textMuted, fontFamily: F.mono, marginTop: 2 },

  messagesScroll: { flex: 1 },
  messagesPad: { paddingHorizontal: 14, paddingVertical: 12, paddingBottom: 80 },
  dateDivider: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14, marginTop: 6 },
  dateLine: { flex: 1, height: 1, backgroundColor: C.border },
  dateText: { fontSize: 10, color: C.textMuted, fontFamily: F.mono, letterSpacing: 1, textTransform: "uppercase" },

  bubbleRow: { marginBottom: 14, alignItems: "flex-start", maxWidth: "82%" },
  bubbleRowMine: { alignSelf: "flex-end", alignItems: "flex-end" },
  bubble: { borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleTheirs: { backgroundColor: "#f1f3f5", borderWidth: 1, borderColor: C.border, borderBottomLeftRadius: 4 },
  bubbleMine: { backgroundColor: "#e8f0f5", borderWidth: 1, borderColor: C.border, borderBottomRightRadius: 4 },
  bubbleText: { fontSize: 14, color: C.textPrimary, fontFamily: F.dm, lineHeight: 20 },
  bubbleTextMine: { color: C.textPrimary },
  bubbleMeta: { flexDirection: "row", alignItems: "center", marginTop: 4, paddingHorizontal: 4 },
  bubbleMetaMine: { justifyContent: "flex-end" },
  bubbleTime: { fontSize: 9, color: C.textMuted, fontFamily: F.mono },

  attachmentItem: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, marginBottom: 4, minWidth: 200 },
  attachmentItemTheirs: { backgroundColor: "#f1f3f5", borderWidth: 1, borderColor: C.border, borderBottomLeftRadius: 3 },
  attachmentItemMine: { backgroundColor: "#e8f0f5", borderWidth: 1, borderColor: C.border, borderBottomRightRadius: 3 },
  attachmentName: { fontSize: 13, fontWeight: "500", color: C.textPrimary, fontFamily: F.dm },
  attachmentSize: { fontSize: 10, color: C.textMuted, fontFamily: F.mono, marginTop: 2 },
  attDownloadBtn: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", marginLeft: 8 },
  attDownloadMine: { backgroundColor: "rgba(44,62,80,0.15)" },
  attDownloadTheirs: { backgroundColor: "rgba(52,152,219,0.15)" },

  jumpBtn: {
    position: "absolute",
    bottom: 100,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },

  quickRepliesBar: {
    backgroundColor: C.surface,
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingVertical: 6,
  },
  quickRepliesContent: {
    paddingHorizontal: 12,
    gap: 8,
    alignItems: "center",
  },
  quickReplyChip: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: C.background,
    borderWidth: 1,
    borderColor: C.border,
  },
  quickReplyText: {
    fontSize: 11,
    color: C.textSecondary,
    fontFamily: F.mono,
  },

  attachmentsPreview: {
    flexDirection: "row", flexWrap: "wrap", gap: 6,
    paddingHorizontal: 12, paddingVertical: 8,
    backgroundColor: C.surface, borderTopWidth: 1, borderTopColor: C.border,
  },
  attachmentPreviewItem: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6,
  },
  attachmentPreviewName: { fontSize: 11, color: C.textSecondary, fontFamily: F.mono, maxWidth: 100 },
  attachmentPreviewSize: { fontSize: 9, color: C.textMuted, fontFamily: F.mono },

  inputBar: {
    backgroundColor: C.surface,
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingHorizontal: 12,
    paddingTop: 10,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  attachBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: C.background, borderWidth: 1, borderColor: C.border,
    alignItems: "center", justifyContent: "center",
    marginBottom: 2,
  },

  messageInput: {
    flex: 1,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 14,
    fontFamily: F.dm,
    color: C.textPrimary,
    maxHeight: 120,
    minHeight: 42,
  },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.primary, alignItems: "center", justifyContent: "center", marginBottom: 2 },
  sendBtnDisabled: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalCard: {
    backgroundColor: C.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 20, paddingBottom: Platform.OS === "ios" ? 34 : 20,
  },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 18 },
  modalTitle: { fontSize: 18, fontWeight: "700", color: C.textPrimary, fontFamily: F.bebas, letterSpacing: 1 },
  modalLabel: { fontSize: 10, fontWeight: "700", color: C.textMuted, fontFamily: F.mono, letterSpacing: 2, marginBottom: 8, textTransform: "uppercase" },

  modalInput: {
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 8,
    padding: 12, fontSize: 14, color: C.textPrimary, fontFamily: F.dm,
    minHeight: 80, textAlignVertical: "top", marginBottom: 16,
  },
  modalSendBtn: { backgroundColor: C.primary, borderRadius: 8, paddingVertical: 14, alignItems: "center" },
  modalSendText: { fontSize: 14, fontWeight: "700", color: "#ffffff", fontFamily: F.dm, letterSpacing: 1, textTransform: "uppercase" },
  recipientItem: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8, marginBottom: 4 },
  recipientItemActive: { backgroundColor: "rgba(44,62,80,0.08)", borderWidth: 1, borderColor: C.border },
  recipientAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.background, alignItems: "center", justifyContent: "center" },
  recipientAvatarActive: { backgroundColor: "rgba(44,62,80,0.15)" },
  recipientAvatarText: { fontSize: 14, fontWeight: "700", color: C.textMuted, fontFamily: F.bebas },
  recipientName: { fontSize: 14, fontWeight: "600", color: C.textPrimary, fontFamily: F.dm },
  recipientRole: { fontSize: 11, color: C.textMuted, fontFamily: F.mono, textTransform: "capitalize" },
});