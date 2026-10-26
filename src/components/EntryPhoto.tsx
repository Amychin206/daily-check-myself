import { Image, ImageStyle, StyleProp, View } from 'react-native';
import { usePhotoUri } from '../photos';
import { useTheme } from '../theme';

export function EntryPhoto({ photoFile, style }: { photoFile: string; style: StyleProp<ImageStyle> }) {
  const theme = useTheme();
  const uri = usePhotoUri(photoFile);
  if (!uri) return <View style={[style as object, { backgroundColor: theme.empty }]} />;
  return <Image source={{ uri }} style={style} resizeMode="cover" />;
}
