import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import client from '../api/client';
import { colors, shadows } from '../theme/colors';

export default function AIChatScreen() {
  const [pets, setPets] = useState([]);
  const [petId, setPetId] = useState(null);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: 'Namaste! 🐾 I\'m your AI pet care assistant. Ask me anything about your pet\'s health, nutrition, or care. For emergencies, please contact a vet directly.',
    },
  ]);
  const [busy, setBusy] = useState(false);
  const list = useRef(null);

  useEffect(() => {
    client.get('/pets').then((r) => setPets(r.data.pets || [])).catch(() => {});
  }, []);

  const send = async () => {
    const q = input.trim();
    if (!q || busy) return;
    setMessages((m) => [...m, { role: 'user', text: q }]);
    setInput('');
    setBusy(true);
    try {
      const r = await client.post('/ai/chat', { question: q, petId });
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          text: r.data.answer,
          meta: { confidence: r.data.confidence, sources: r.data.sources, fallback: r.data.fallbackUsed },
        },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: 'assistant', text: 'I had trouble reaching the AI. Please try again or consult a veterinarian.', meta: { error: true } },
      ]);
    } finally {
      setBusy(false);
      setTimeout(() => list.current?.scrollToEnd({ animated: true }), 50);
    }
  };

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      {/* Pet Context */}
      {pets.length > 0 && (
        <View style={s.petBar}>
          <Ionicons name="paw" size={14} color={colors.textMuted} />
          <Text style={s.petBarLabel}>Context:</Text>
          <TouchableOpacity onPress={() => setPetId(null)} style={[s.petChip, !petId && s.petChipActive]}>
            <Text style={[s.petChipText, !petId && s.petChipTextActive]}>General</Text>
          </TouchableOpacity>
          {pets.map((p) => (
            <TouchableOpacity key={p.id} onPress={() => setPetId(p.id)} style={[s.petChip, petId === p.id && s.petChipActive]}>
              <Text style={[s.petChipText, petId === p.id && s.petChipTextActive]}>{p.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Messages */}
      <FlatList
        ref={list}
        data={messages}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={s.msgList}
        renderItem={({ item }) => (
          <View style={[s.msgRow, item.role === 'user' ? s.msgRowUser : s.msgRowBot]}>
            {item.role === 'assistant' && (
              <View style={s.botAvatar}>
                <Ionicons name="sparkles" size={14} color={colors.primary} />
              </View>
            )}
            <View style={[s.bubble, item.role === 'user' ? s.bubbleUser : s.bubbleBot]}>
              <Text style={item.role === 'user' ? s.textUser : s.textBot}>{item.text}</Text>
              {item.meta && !item.meta.error && (
                <Text style={s.metaText}>
                  {item.meta.fallback ? 'fallback · ' : ''}
                  {Math.round((item.meta.confidence || 0) * 100)}% confidence
                </Text>
              )}
            </View>
          </View>
        )}
      />

      {busy && (
        <View style={s.typingRow}>
          <View style={s.botAvatar}>
            <Ionicons name="sparkles" size={14} color={colors.primary} />
          </View>
          <View style={[s.bubble, s.bubbleBot]}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        </View>
      )}

      {/* Input Bar */}
      <View style={[s.inputBar, shadows.md]}>
        <TextInput
          style={s.input}
          placeholder="Ask about your pet's health..."
          placeholderTextColor={colors.textMuted}
          value={input}
          onChangeText={setInput}
          editable={!busy}
          multiline
          maxLength={500}
          onSubmitEditing={send}
          returnKeyType="send"
        />
        <TouchableOpacity
          style={[s.sendBtn, (!input.trim() || busy) && s.sendBtnDisabled]}
          disabled={!input.trim() || busy}
          onPress={send}
          activeOpacity={0.8}
        >
          <Ionicons name="send" size={18} color={colors.white} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  petBar: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, padding: 10, paddingHorizontal: 14, backgroundColor: colors.surface, borderBottomWidth: 1, borderColor: colors.border, alignItems: 'center' },
  petBarLabel: { fontSize: 12, color: colors.textMuted },
  petChip: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.bg },
  petChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  petChipText: { color: colors.textSub, fontSize: 12, fontWeight: '600' },
  petChipTextActive: { color: colors.white },
  msgList: { padding: 16, gap: 12, paddingBottom: 8 },
  msgRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  msgRowUser: { justifyContent: 'flex-end' },
  msgRowBot: { justifyContent: 'flex-start' },
  botAvatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  bubble: { maxWidth: '78%', padding: 12, borderRadius: 18 },
  bubbleUser: { backgroundColor: colors.primary, borderBottomRightRadius: 4 },
  bubbleBot: { backgroundColor: colors.surface, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: colors.border },
  textUser: { color: colors.white, fontSize: 15, lineHeight: 21 },
  textBot: { color: colors.text, fontSize: 15, lineHeight: 21 },
  metaText: { color: colors.textMuted, fontSize: 11, marginTop: 5 },
  typingRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingHorizontal: 16, paddingBottom: 8 },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', padding: 10, paddingHorizontal: 14, borderTopWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, gap: 10 },
  input: { flex: 1, borderWidth: 1.5, borderColor: colors.border, borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, color: colors.text, backgroundColor: colors.bg, maxHeight: 100 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { backgroundColor: colors.border },
});
