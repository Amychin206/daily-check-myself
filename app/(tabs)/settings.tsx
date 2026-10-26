import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { exportBackup, readBackup } from '../../src/backup';
import { applyReminders, loadReminders, ReminderSettings } from '../../src/reminders';
import { SECTIONS, SectionKey } from '../../src/sections';
import { useStore } from '../../src/store';
import { useSync } from '../../src/sync';
import { Theme, useTheme } from '../../src/theme';

export default function SettingsScreen() {
  const theme = useTheme();
  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
      <SyncCard theme={theme} />
      <RemindersCard theme={theme} />
      <BackupCard theme={theme} />
    </ScrollView>
  );
}

function SyncCard({ theme }: { theme: Theme }) {
  const { available, user, status, signIn, signOut, syncNow } = useSync();

  if (!available) {
    return (
      <View style={[styles.card, { backgroundColor: theme.card }]}>
        <Text style={[styles.cardTitle, { color: theme.text }]}>多设备同步</Text>
        <Text style={{ color: theme.muted, lineHeight: 20 }}>
          Expo Go 预览版不支持 Google 登录。安装正式打包的 APK 后即可开启同步，现在可以先用下面的备份功能。
        </Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={[styles.card, { backgroundColor: theme.card }]}>
        <Text style={[styles.cardTitle, { color: theme.text }]}>多设备同步</Text>
        <Text style={{ color: theme.muted, lineHeight: 20 }}>
          用 Google 账号登录后，打卡和照片会自动同步到你的 Google Drive（app
          专用的隐藏文件夹）。在另一台手机上用同一个账号登录即可看到全部记录。
        </Text>
        <Pressable
          style={[styles.button, styles.single, { backgroundColor: theme.accent }]}
          onPress={() =>
            signIn().catch((err) => Alert.alert('登录失败', err instanceof Error ? err.message : String(err)))
          }
        >
          <Text style={styles.buttonText}>用 Google 账号登录</Text>
        </Pressable>
      </View>
    );
  }

  const detail =
    status.state === 'syncing'
      ? '正在同步…'
      : status.state === 'error'
        ? `同步失败：${status.error}`
        : status.lastSyncedAt
          ? `上次同步：${status.lastSyncedAt.toLocaleString('zh-CN')}`
          : '尚未同步';

  return (
    <View style={[styles.card, { backgroundColor: theme.card }]}>
      <Text style={[styles.cardTitle, { color: theme.text }]}>多设备同步</Text>
      <Text style={{ color: theme.text }}>已登录：{user.user.email}</Text>
      <Text style={{ color: status.state === 'error' ? theme.danger : theme.muted, marginTop: 4 }}>{detail}</Text>
      <View style={styles.row}>
        <Pressable
          style={[styles.button, { backgroundColor: theme.accent }]}
          onPress={syncNow}
          disabled={status.state === 'syncing'}
        >
          {status.state === 'syncing' ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>立即同步</Text>
          )}
        </Pressable>
        <Pressable
          style={[styles.button, { backgroundColor: theme.empty }]}
          onPress={() =>
            Alert.alert('退出登录？', '这台手机上的记录会保留，Google Drive 里的也不会删除。', [
              { text: '取消', style: 'cancel' },
              { text: '退出', style: 'destructive', onPress: () => signOut() },
            ])
          }
        >
          <Text style={[styles.buttonText, { color: theme.text }]}>退出登录</Text>
        </Pressable>
      </View>
    </View>
  );
}

function BackupCard({ theme }: { theme: Theme }) {
  const { entries, mergeEntries } = useStore();
  const [busy, setBusy] = useState<'export' | 'import' | null>(null);

  async function doExport() {
    setBusy('export');
    try {
      await exportBackup(entries);
    } catch (err) {
      Alert.alert('导出失败', err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(null);
    }
  }

  async function doImport() {
    setBusy('import');
    try {
      const incoming = await readBackup();
      if (incoming) {
        const changed = mergeEntries(incoming);
        Alert.alert(
          '导入完成',
          changed ? `更新了 ${changed} 条打卡。` : '没有需要更新的内容，这台手机上的记录已经是最新的。',
        );
      }
    } catch (err) {
      Alert.alert('导入失败', err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(null);
    }
  }

  return (
    <View style={[styles.card, { backgroundColor: theme.card }]}>
      <Text style={[styles.cardTitle, { color: theme.text }]}>备份与恢复</Text>
      <Text style={{ color: theme.muted, lineHeight: 20 }}>
        导出的备份包含所有打卡、日记和照片，可以保存到网盘或发到另一台手机。导入时会和这台手机上的记录合并，同一天同一版面以最后修改的为准。
      </Text>
      <View style={styles.row}>
        <Pressable style={[styles.button, { backgroundColor: theme.accent }]} onPress={doExport} disabled={!!busy}>
          {busy === 'export' ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>导出备份</Text>}
        </Pressable>
        <Pressable style={[styles.button, { backgroundColor: theme.empty }]} onPress={doImport} disabled={!!busy}>
          {busy === 'import' ? (
            <ActivityIndicator color={theme.text} />
          ) : (
            <Text style={[styles.buttonText, { color: theme.text }]}>导入备份</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

function RemindersCard({ theme }: { theme: Theme }) {
  const [settings, setSettings] = useState<ReminderSettings | null>(null);

  useEffect(() => {
    loadReminders().then(setSettings);
  }, []);

  if (!settings) return null;

  async function update(key: SectionKey, patch: Partial<ReminderSettings[SectionKey]>) {
    if (!settings) return;
    const next = { ...settings, [key]: { ...settings[key], ...patch } };
    setSettings(next);
    const ok = await applyReminders(next);
    if (!ok) {
      Alert.alert('无法发送提醒', '请在系统设置里允许本应用发送通知。');
      const off = { ...next, [key]: { ...next[key], enabled: false } };
      setSettings(off);
      await applyReminders(off);
    }
  }

  const step = (key: SectionKey, minutes: number) => {
    const r = settings[key];
    const total = (r.hour * 60 + r.minute + minutes + 24 * 60) % (24 * 60);
    update(key, { hour: Math.floor(total / 60), minute: total % 60 });
  };

  return (
    <View style={[styles.card, { backgroundColor: theme.card }]}>
      <Text style={[styles.cardTitle, { color: theme.text }]}>每日提醒</Text>
      {SECTIONS.map((s) => {
        const r = settings[s.key];
        const time = `${String(r.hour).padStart(2, '0')}:${String(r.minute).padStart(2, '0')}`;
        return (
          <View key={s.key} style={[styles.reminderRow, { borderColor: theme.border }]}>
            <Text style={[styles.reminderName, { color: theme.text }]}>
              {s.emoji} {s.title}
            </Text>
            <View style={[styles.timeBox, { opacity: r.enabled ? 1 : 0.4 }]}>
              <Pressable hitSlop={8} onPress={() => step(s.key, -30)} disabled={!r.enabled}>
                <Text style={[styles.stepper, { color: theme.accent }]}>−</Text>
              </Pressable>
              <Text style={[styles.time, { color: theme.text }]}>{time}</Text>
              <Pressable hitSlop={8} onPress={() => step(s.key, 30)} disabled={!r.enabled}>
                <Text style={[styles.stepper, { color: theme.accent }]}>＋</Text>
              </Pressable>
            </View>
            <Switch value={r.enabled} onValueChange={(enabled) => update(s.key, { enabled })} />
          </View>
        );
      })}
      <Text style={{ color: theme.muted, fontSize: 12, marginTop: 8 }}>
        点 − / ＋ 每次调整 30 分钟。提醒只在这台手机上生效。
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 14, padding: 16, marginBottom: 12 },
  cardTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  row: { flexDirection: 'row', gap: 10, marginTop: 12 },
  button: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  single: { flex: 0, marginTop: 12 },
  buttonText: { color: '#fff', fontWeight: '600' },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  reminderName: { flex: 1, fontSize: 15 },
  timeBox: { flexDirection: 'row', alignItems: 'center', marginRight: 12 },
  stepper: { fontSize: 20, paddingHorizontal: 8 },
  time: { fontSize: 15, fontVariant: ['tabular-nums'], width: 48, textAlign: 'center' },
});
