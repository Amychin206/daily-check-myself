import { Image, ImageStyle, StyleProp } from 'react-native';
import { localPhotoUri } from '../photos';

export function EntryPhoto({ photoFile, style }: { photoFile: string; style: StyleProp<ImageStyle> }) {
  return <Image source={{ uri: localPhotoUri(photoFile) }} style={style} resizeMode="cover" />;
}
