import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function Customization() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Customization</Text>
      <Pressable style={styles.section} onPress={() => router.push('/settings')}>
        <Ionicons name="settings" size={24} color="#fff" style={styles.icon} />
        <Text style={styles.sectionText}>Settings</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    paddingTop: 60,
    paddingHorizontal: 24,
  },
  header: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 32,
  },
  section: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  sectionText: {
    color: '#fff',
    fontSize: 20,
    marginLeft: 16,
  },
  icon: {
    width: 32,
    textAlign: 'center',
  },
});
