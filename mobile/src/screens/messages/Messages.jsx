// TENANT MESSAGES SCREEN 
import { useState, useEffect, useCallback, useRef } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, SafeAreaView, StatusBar, RefreshControl,
  ActivityIndicator, KeyboardAvoidingView, Platform, Alert,
  Linking, Modal, Keyboard,
} from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import api from "../../utils/api";
import { Image } from "react-native";

const C = {
  black:      "#0a0a0a",
  muted:      "#141414",
  muted2:     "#1a1a1a",
  border:     "#2a2a2a",
  gold:       "#E8A012",
  white:      "#F5F0E8",
  blue:       "#3A8FD4",
  green:      "#1A7A4A",
  red:        "#E05A4A",
  purple:     "#8B5CF6",
};
const F = { bebas: "bebas-neue", dm: "dm-sans", mono: "space-mono" };

function initials(name = "") {
  return (name || "").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
}
function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60)         return "Just now";
  if (diff < 3600)       return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)      return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 7 * 86400)  return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString("en-ZA", { day: "2-digit", month: "short" });
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
                    <Ionicons name="document-outline" size={22} color="rgba(245,240,232,0.5)" />
                  )}
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <Text style={S.attachmentName} numberOfLines={2}>
                      {att.name || "Attachment"}
                    </Text>
                    {att.file_size ? (
                      <Text style={S.attachmentSize}>
                        {att.file_size > 1024 * 1024
                          ? `${(att.file_size / (1024 * 1024)).toFixed(1)} MB`
                          : att.file_size > 1024
                          ? `${(att.file_size / 1024).toFixed(0)} KB`
                          : `${att.file_size} B`}
                      </Text>
                    ) : null}
                  </View>
                  <View style={[S.attDownloadBtn, isMine ? S.attDownloadMine : S.attDownloadTheirs]}>
                    <Ionicons name="arrow-down-circle-outline" size={16} color={isMine ? C.gold : C.blue} />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Timestamp */}
        <View style={[S.bubbleMeta, isMine && S.bubbleMetaMine]}>
          <Text style={S.bubbleTime}>{timeAgo(message.created_at)}</Text>
          {isMine && message.read && (
            <Ionicons name="checkmark-done" size={12} color={C.green} style={{ marginLeft: 4 }} />
          )}
        </View>
      </View>

      {/* FULL SCREEN IMAGE MODAL*/}
      <Modal visible={!!fullScreenImage} transparent animationType="fade" onRequestClose={() => setFullScreenImage(null)}>
        <View style={{
          flex: 1, backgroundColor: "rgba(0,0,0,0.95)",
          justifyContent: "center", alignItems: "center",
        }}>
          <TouchableOpacity
            style={{ position: "absolute", top: 50, right: 20, zIndex: 10, padding: 10 }}
            onPress={() => setFullScreenImage(null)}
          >
            <Ionicons name="close-circle" size={32} color={C.white} />
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
                paddingHorizontal: 20, paddingVertical: 12,
                backgroundColor: C.gold, borderRadius: 8,
              }}
              onPress={() => {
                if (fullScreenImage) Linking.openURL(fullScreenImage);
                setFullScreenImage(null);
              }}
            >
              <Text style={{ color: C.black, fontWeight: "700", fontFamily: F.dm }}>Open Full Size</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                paddingHorizontal: 20, paddingVertical: 12,
                backgroundColor: "transparent", borderRadius: 8,
                borderWidth: 1, borderColor: C.border,
              }}
              onPress={() => setFullScreenImage(null)}
            >
              <Text style={{ color: C.white, fontWeight: "600", fontFamily: F.dm }}>Close</Text>
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
            {/* Header */}
            <View style={S.modalHeader}>
              <Text style={S.modalTitle}>New Message</Text>
              <TouchableOpacity onPress={handleClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close" size={22} color="rgba(245,240,232,0.4)" />
              </TouchableOpacity>
            </View>

            {/* Recipient list */}
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
                    <Text style={[S.recipientAvatarText, selectedId === r.user_id && { color: C.gold }]}>
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
                    <Ionicons name="checkmark-circle" size={20} color={C.gold} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Message input  */}
            <Text style={S.modalLabel}>MESSAGE</Text>
            <TextInput
              style={S.modalInput}
              value={msg}
              onChangeText={setMsg}
              placeholder="Type your message..."
              placeholderTextColor="rgba(245,240,232,0.2)"
              multiline
              maxLength={500}
              color={C.white}
              textAlignVertical="top"
            />

            <TouchableOpacity
              style={[S.modalSendBtn, (!selectedId || !msg.trim()) && { opacity: 0.4 }]}
              onPress={handleSend}
              disabled={!selectedId || !msg.trim() || sending}
              activeOpacity={0.8}
            >
              {sending ? (
                <ActivityIndicator color={C.black} size="small" />
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

  const unreadTotal = conversations.reduce((sum, c) => sum + (c.unread || 0), 0);
  const canSend     = (messageInput.trim().length > 0 || attachments.length > 0) && !sending;

  if (!activeConvo) {
    return (
      <SafeAreaView style={S.safe}>
        <StatusBar barStyle="light-content" backgroundColor={C.black} />
        <View style={S.header}>
          <View style={{ flex: 1 }}>
            <Text style={S.headerTitle}>Messages</Text>
            <Text style={S.headerSub}>
              {conversations.length} conversation{conversations.length !== 1 ? "s" : ""}
              {unreadTotal > 0 ? ` · ${unreadTotal} unread` : ""}
            </Text>
          </View>
          <TouchableOpacity style={S.newMsgBtn} onPress={() => setShowNewMsg(true)} activeOpacity={0.7}>
            <Ionicons name="create-outline" size={18} color={C.gold} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={S.loader}><ActivityIndicator size="large" color={C.gold} /></View>
        ) : conversations.length === 0 ? (
          <View style={S.emptyState}>
            <View style={S.emptyIcon}>
              <Ionicons name="chatbubbles-outline" size={40} color="rgba(245,240,232,0.1)" />
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
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.gold} />
            }
          >
            {conversations.map(convo => (
              <ConversationItem key={convo.id} convo={convo} onPress={() => openConvo(convo)} />
            ))}
            <View style={{ height: 24 }} />
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
      <StatusBar barStyle="light-content" backgroundColor={C.black} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        {/* Chat header */}
        <View style={S.chatHeader}>
          <TouchableOpacity onPress={closeConvo} style={S.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Feather name="arrow-left" size={20} color={C.white} />
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
          onContentSizeChange={() => messagesRef.current?.scrollToEnd({ animated: true })}
        >
          <View style={S.dateDivider}>
            <View style={S.dateLine} />
            <Text style={S.dateText}>
              {new Date(
                activeConvo.messages?.[0]?.created_at || Date.now()
              ).toLocaleDateString("en-ZA", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </Text>
            <View style={S.dateLine} />
          </View>

          {(activeConvo.messages || []).map(msg => (
            <ChatBubble key={msg.id} message={msg} isMine={msg.sender_id === "me"} />
          ))}
          <View style={{ height: 16 }} />
        </ScrollView>

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
                <TouchableOpacity
                  onPress={() => setAttachments(prev => prev.filter((_, j) => j !== i))}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  <Ionicons name="close-circle" size={16} color="rgba(245,240,232,0.35)" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        <View style={[S.inputBar, Platform.OS === "android" && { paddingBottom: keyboardHeight || 10 }]}>
          <View style={S.inputRow}>
            <TouchableOpacity style={S.attachBtn} onPress={pickFile} activeOpacity={0.7}>
              <Ionicons name="attach" size={20} color="rgba(245,240,232,0.45)" />
            </TouchableOpacity>

            {/* FIX: color + selectionColor ensure typed text is always visible */}
            <TextInput
              style={S.messageInput}
              value={messageInput}
              onChangeText={setMessageInput}
              placeholder="Type a message..."
              placeholderTextColor="rgba(245,240,232,0.25)"
              color={C.white}                         
              selectionColor={C.gold}                 
              multiline
              maxLength={500}
              returnKeyType="default"
              blurOnSubmit={false}
              keyboardAppearance="dark"             
              onSubmitEditing={() => {}}
            />

            <TouchableOpacity
              style={[S.sendBtn, !canSend && S.sendBtnDisabled]}
              onPress={handleSend}
              disabled={!canSend}
              activeOpacity={0.8}
            >
              {sending ? (
                <ActivityIndicator size="small" color={canSend ? C.black : "rgba(245,240,232,0.3)"} />
              ) : (
                <Ionicons
                  name="send"
                  size={16}
                  color={canSend ? C.black : "rgba(245,240,232,0.25)"}
                />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.black },

  // List header
  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingTop: 14, paddingBottom: 12,
    backgroundColor: C.muted2, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  headerTitle: { fontSize: 22, fontWeight: "700", color: C.white, fontFamily: F.bebas, letterSpacing: 1 },
  headerSub: { fontSize: 11, color: "rgba(245,240,232,0.3)", fontFamily: F.mono, marginTop: 2 },
  newMsgBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "rgba(232,160,18,0.1)", borderWidth: 1, borderColor: "rgba(232,160,18,0.2)",
    alignItems: "center", justifyContent: "center",
  },

  loader: { flex: 1, alignItems: "center", justifyContent: "center" },
  scroll: { flex: 1 },

  // Empty state
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 40 },
  emptyIcon: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: C.muted2,
    borderWidth: 1, borderColor: C.border, alignItems: "center", justifyContent: "center", marginBottom: 12,
  },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: "rgba(245,240,232,0.4)", fontFamily: F.bebas, letterSpacing: 1, marginBottom: 4 },
  emptySub: { fontSize: 12, color: "rgba(245,240,232,0.25)", fontFamily: F.mono, textAlign: "center", lineHeight: 18, marginBottom: 16 },
  emptyBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, backgroundColor: C.gold },
  emptyBtnText: { fontSize: 12, fontWeight: "700", color: C.black, fontFamily: F.dm },

  // Conversation item
  convoItem: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 16, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  convoAvatar: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: "rgba(232,160,18,0.1)", borderWidth: 1.5, borderColor: "rgba(232,160,18,0.15)",
    alignItems: "center", justifyContent: "center",
  },
  convoAvatarText: { color: C.gold, fontSize: 17, fontWeight: "700", fontFamily: F.bebas },
  onlineDot: {
    position: "absolute", bottom: 2, right: 2,
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: C.green, borderWidth: 2, borderColor: C.black,
  },
  convoContent: { flex: 1, minWidth: 0 },
  convoHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  convoName: { fontSize: 15, fontWeight: "600", color: C.white, fontFamily: F.dm, flex: 1, marginRight: 8 },
  convoNameUnread: { fontWeight: "700" },
  convoTime: { fontSize: 10, color: "rgba(245,240,232,0.25)", fontFamily: F.mono },
  convoFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  convoPreview: { fontSize: 13, color: "rgba(245,240,232,0.4)", fontFamily: F.dm, flex: 1, marginRight: 8 },
  convoPreviewUnread: { color: "rgba(245,240,232,0.8)", fontWeight: "500" },
  unreadBadge: {
    minWidth: 22, height: 22, borderRadius: 11, backgroundColor: C.gold,
    alignItems: "center", justifyContent: "center", paddingHorizontal: 6,
  },
  unreadBadgeText: { color: C.black, fontSize: 11, fontWeight: "700", fontFamily: F.mono },

  // Chat header
  chatHeader: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    backgroundColor: C.muted2, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  backBtn: { padding: 4 },
  chatHeaderInfo: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  chatAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "rgba(232,160,18,0.12)", borderWidth: 1.5, borderColor: "rgba(232,160,18,0.2)",
    alignItems: "center", justifyContent: "center",
  },
  chatAvatarText: { color: C.gold, fontSize: 14, fontWeight: "700", fontFamily: F.bebas },
  onlineDotSmall: {
    position: "absolute", bottom: 0, right: 0,
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: C.green, borderWidth: 2, borderColor: C.muted2,
  },
  chatName: { fontSize: 15, fontWeight: "600", color: C.white, fontFamily: F.dm },
  chatRole: { fontSize: 11, color: "rgba(245,240,232,0.3)", fontFamily: F.mono, marginTop: 2 },

  // Messages
  messagesScroll: { flex: 1 },
  messagesPad: { paddingHorizontal: 14, paddingVertical: 12 },
  dateDivider: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 18, marginTop: 6 },
  dateLine: { flex: 1, height: 1, backgroundColor: C.border },
  dateText: { fontSize: 10, color: "rgba(245,240,232,0.2)", fontFamily: F.mono, letterSpacing: 1, textTransform: "uppercase" },

  // Bubbles
  bubbleRow: { marginBottom: 14, alignItems: "flex-start", maxWidth: "82%" },
  bubbleRowMine: { alignSelf: "flex-end", alignItems: "flex-end" },
  bubble: { borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleTheirs: { backgroundColor: C.muted2, borderWidth: 1, borderColor: C.border, borderBottomLeftRadius: 4 },
  bubbleMine: { backgroundColor: "rgba(232,160,18,0.12)", borderWidth: 1, borderColor: "rgba(232,160,18,0.2)", borderBottomRightRadius: 4 },
  bubbleText: { fontSize: 14, color: C.white, fontFamily: F.dm, lineHeight: 20 },
  bubbleTextMine: { color: C.white },
  bubbleMeta: { flexDirection: "row", alignItems: "center", marginTop: 4, paddingHorizontal: 4 },
  bubbleMetaMine: { justifyContent: "flex-end" },
  bubbleTime: { fontSize: 9, color: "rgba(245,240,232,0.2)", fontFamily: F.mono },

  // Attachments in bubbles
  attachmentsWrap: { maxWidth: "100%" },
  attachmentItem: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, marginBottom: 4, minWidth: 200 },
  attachmentItemTheirs: { backgroundColor: C.muted2, borderWidth: 1, borderColor: C.border, borderBottomLeftRadius: 3 },
  attachmentItemMine: { backgroundColor: "rgba(232,160,18,0.12)", borderWidth: 1, borderColor: "rgba(232,160,18,0.2)", borderBottomRightRadius: 3 },
  attachmentName: { fontSize: 13, fontWeight: "500", color: C.white, fontFamily: F.dm },
  attachmentSize: { fontSize: 10, color: "rgba(245,240,232,0.4)", fontFamily: F.mono, marginTop: 2 },
  attDownloadBtn: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", marginLeft: 8 },
  attDownloadMine: { backgroundColor: "rgba(232,160,18,0.2)" },
  attDownloadTheirs: { backgroundColor: "rgba(58,143,212,0.15)" },

  quickRepliesBar: { 
    backgroundColor: C.muted2, 
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
    backgroundColor: C.black, 
    borderWidth: 1, 
    borderColor: C.border,
  },
  quickReplyText: { 
    fontSize: 11, 
    color: "rgba(245,240,232,0.5)", 
    fontFamily: F.mono,
  },
  // Attachment previews
  attachmentsPreview: {
    flexDirection: "row", flexWrap: "wrap", gap: 6,
    paddingHorizontal: 12, paddingVertical: 8,
    backgroundColor: C.muted2, borderTopWidth: 1, borderTopColor: C.border,
  },
  attachmentPreviewItem: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: C.black, borderWidth: 1, borderColor: C.border,
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6,
  },
  attachmentPreviewName: { fontSize: 11, color: "rgba(245,240,232,0.5)", fontFamily: F.mono, maxWidth: 100 },

  // Input bar
  inputBar: { backgroundColor: C.muted2, borderTopWidth: 1, borderTopColor: C.border, paddingHorizontal: 12, paddingTop: 10, paddingBottom: 10 },
  inputRow: { flexDirection: "row", alignItems: "flex-end", gap: 8 },
  attachBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: C.black, borderWidth: 1, borderColor: C.border,
    alignItems: "center", justifyContent: "center",
  },

  messageInput: {
    flex: 1,
    backgroundColor: "#0f0f0f",
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 14,
    fontFamily: F.dm,
    maxHeight: 120,
    minHeight: 42,
  },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.gold, alignItems: "center", justifyContent: "center" },
  sendBtnDisabled: { backgroundColor: C.muted, borderWidth: 1, borderColor: C.border },

  // New message modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.75)", justifyContent: "flex-end" },
  modalCard: {
    backgroundColor: C.muted2, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 20, paddingBottom: Platform.OS === "ios" ? 34 : 20,
  },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 18 },
  modalTitle: { fontSize: 18, fontWeight: "700", color: C.white, fontFamily: F.bebas, letterSpacing: 1 },
  modalLabel: { fontSize: 10, fontWeight: "700", color: "rgba(245,240,232,0.3)", fontFamily: F.mono, letterSpacing: 2, marginBottom: 8, textTransform: "uppercase" },

  modalInput: {
    backgroundColor: C.black, borderWidth: 1, borderColor: C.border, borderRadius: 8,
    padding: 12, fontSize: 14, color: C.white, fontFamily: F.dm,
    minHeight: 80, textAlignVertical: "top", marginBottom: 16,
  },
  modalSendBtn: { backgroundColor: C.gold, borderRadius: 8, paddingVertical: 14, alignItems: "center" },
  modalSendText: { fontSize: 14, fontWeight: "700", color: C.black, fontFamily: F.dm, letterSpacing: 1, textTransform: "uppercase" },
  recipientItem: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8, marginBottom: 4 },
  recipientItemActive: { backgroundColor: "rgba(232,160,18,0.08)", borderWidth: 1, borderColor: "rgba(232,160,18,0.2)" },
  recipientAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(245,240,232,0.08)", alignItems: "center", justifyContent: "center" },
  recipientAvatarActive: { backgroundColor: "rgba(232,160,18,0.15)" },
  recipientAvatarText: { fontSize: 14, fontWeight: "700", color: "rgba(245,240,232,0.5)", fontFamily: F.bebas },
  recipientName: { fontSize: 14, fontWeight: "600", color: C.white, fontFamily: F.dm },
  recipientRole: { fontSize: 11, color: "rgba(245,240,232,0.3)", fontFamily: F.mono, textTransform: "capitalize" },
});