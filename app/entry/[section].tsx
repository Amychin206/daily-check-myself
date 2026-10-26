import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { Stack } from 'expo-router/stack';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { EntryPhoto } from '../../src/components/EntryPhoto';
import { formatDateLabel, todayKey } from '../../src/dates';
import { deleteLocalPhoto, persistPhoto } from '../../src/photos';
import { isSectionKey, SECTION_BY_KEY } from '../../src/sections';
import { useStore } from '../../src/store';
import { useTheme } from '../../src/theme';

export default function EntryScreen() {
  const params = useLocalSearchParams<{ section: string; date?: string }>();
  if (!isSectionKey(params.section)) return null;
  return <EntryEditor section={params.section} date={params.date ?? todayKey()} />;
}

function EntryEditor({ section: key, date }: { section: keyof typeof SECTION_BY_KEY; date: string }) {
  const theme = useTheme();
  const section = SECTION_BY_KEY[key];
  const { getEntry, saveEntry, deleteEntry } = useStore();
  const existing = getEntry(date, key);

  const [note, setNote] = useState(existing?.note ?? '');
  const [photoFile, setPhotoFile] = useState<string | null>(existing?.photoFile ?? null);
  // Photos picked in this session that weren't saved should be cleaned up.
  const [pickedFiles, setPickedFiles] = useState<string[]>([]);

  async function pick(source: 'camera' | 'library') {
    const perm =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('没有权限', source === 'camera' ? '请在系统设置里允许使用相机。' : '请在系统设置里允许访问相册。');
      return;
    }
    const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.6, allowsEditing: true };
    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);
    if (result.canceled || !result.assets[0]) return;
    const name = await persistPhoto(result.assets[0].uri);
    setPickedFiles((f) => [...f, name]);
    setPhotoFile(name);
  }

  function cleanupUnsaved(keep: string | null) {
    for (const f of pickedFiles) if (f !== keep) deleteLocalPhoto(f);
  }

  function save() {
    if (!note.trim() && !photoFile) {
      Alert.alert('还没有内容', '拍张照片或写几句日记再打卡吧。');
      return;
    }
    cleanupUnsaved(photoFile);
    saveEntry(date, key, { note: note.trim(), photoFile });
    router.back();
  }

  function remove() {
    Alert.alert('删除这条打卡？', '照片和日记都会被删除。', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: () => {
          cleanupUnsaved(null);
          deleteEntry(date, key);
          router.back();
        },
      },
    ]);
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen options={{ title: `${section.emoji} ${section.title}` }} />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={[styles.date, { color: theme.muted }]}>{formatDateLabel(date)}</Text>

        {photoFile ? (
          <View>
            <EntryPhoto photoFile={photoFile} style={styles.photo} />
            <Pressable style={styles.removePhoto} onPress={() => setPhotoFile(null)}>
              <Text style={styles.removePhotoText}>✕</Text>
            </Pressable>
          </View>
        ) : (
          <View
            style={[
              styles.photo,
              styles.placeholder,
              { backgroundColor: section.color + '18', borderColor: section.color },
            ]}
          >
            <Text style={{ fontSize: 48 }}>{section.emoji}</Text>
            <Text style={{ color: theme.muted, marginTop: 8 }}>拍张照片记录一下</Text>
          </View>
        )}

        <View style={styles.row}>
          <Pressable style={[styles.button, { backgroundColor: section.color }]} onPress={() => pick('camera')}>
            <Text style={styles.buttonText}>📷 拍照</Text>
          </Pressable>
          <Pressable
            style={[styles.button, { backgroundColor: theme.card, borderColor: section.color, borderWidth: 1 }]}
            onPress={() => pick('library')}
          >
            <Text style={[styles.buttonText, { color: section.color }]}>🖼️ 相册</Text>
          </Pressable>
        </View>

        <Text style={[styles.label, { color: theme.text }]}>日记</Text>
        <TextInput
          style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
          placeholder={section.prompt}
          placeholderTextColor={theme.muted}
          value={note}
          onChangeText={setNote}
          multiline
          textAlignVertical="top"
        />

        <Pressable style={[styles.save, { backgroundColor: theme.accent }]} onPress={save}>
          <Text style={styles.saveText}>{existing ? '保存修改' : '完成打卡'}</Text>
        </Pressable>
        {existing ? (
          <Pressable style={styles.delete} onPress={remove}>
            <Text style={{ color: theme.danger }}>删除这条打卡</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 48 },
  date: { marginBottom: 12, fontSize: 14 },
  photo: { width: '100%', aspectRatio: 4 / 3, borderRadius: 14 },
  placeholder: { alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderStyle: 'dashed' },
  removePhoto: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removePhotoText: { color: '#fff', fontSize: 16 },
  row: { flexDirection: 'row', gap: 12, marginTop: 12 },
  button: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  label: { marginTop: 24, marginBottom: 8, fontSize: 16, fontWeight: '700' },
  input: { minHeight: 160, borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 15, lineHeight: 22 },
  save: { marginTop: 24, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  saveText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  delete: { marginTop: 16, alignItems: 'center', padding: 8 },
});
