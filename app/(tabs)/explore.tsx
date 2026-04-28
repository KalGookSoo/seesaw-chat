import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import { Platform, Text, View } from 'react-native';

import { Collapsible } from '@/components/ui/collapsible';
import { ExternalLink } from '@/components/external-link';
import ParallaxScrollView from '@/components/parallax-scroll-view';

export default function TabTwoScreen() {
  return (
    <ParallaxScrollView headerBackgroundColor={{ light: '#D0D0D0', dark: '#353636' }} headerImage={<MaterialIcons size={310} color="#808080" name="code" className="absolute -bottom-24 -left-9" />}>
      <View className="flex-row gap-2 mb-2">
        <Text className="text-3xl font-bold text-foreground">Explore</Text>
      </View>

      <Text className="text-base text-secondary-foreground mb-4">This app includes example code to help you get started.</Text>

      <Collapsible title="File-based routing">
        <Text className="text-secondary-foreground mb-2">
          This app has two screens: <Text className="font-semibold text-foreground">app/(tabs)/index.tsx</Text> and{' '}
          <Text className="font-semibold text-foreground">app/(tabs)/explore.tsx</Text>
        </Text>
        <Text className="text-secondary-foreground mb-4">
          The layout file in <Text className="font-semibold text-foreground">app/(tabs)/_layout.tsx</Text> sets up the tab navigator.
        </Text>
        <ExternalLink href="https://docs.expo.dev/router/introduction">
          <Text className="text-primary-500 font-medium">Learn more</Text>
        </ExternalLink>
      </Collapsible>

      <Collapsible title="Android, iOS, and web support">
        <Text className="text-secondary-foreground">
          You can open this project on Android, iOS, and the web. To open the web version, press <Text className="font-semibold text-foreground">w</Text> in the terminal running this
          project.
        </Text>
      </Collapsible>

      <Collapsible title="Images">
        <Text className="text-secondary-foreground mb-4">
          For static images, you can use the <Text className="font-semibold text-foreground">@2x</Text> and <Text className="font-semibold text-foreground">@3x</Text>{' '}
          suffixes to provide files for different screen densities.
        </Text>
        <Image source={require('@/assets/images/react-logo.png')} className="w-24 h-24 self-center mb-4" />
        <ExternalLink href="https://reactnative.dev/docs/images">
          <Text className="text-primary-500 font-medium">Learn more</Text>
        </ExternalLink>
      </Collapsible>

      <Collapsible title="Light and dark mode components">
        <Text className="text-secondary-foreground mb-4">
          This template has light and dark mode support. The <Text className="font-semibold text-foreground">useColorScheme()</Text> hook lets you inspect what the user&apos;s current color
          scheme is, and so you can adjust UI colors accordingly.
        </Text>
        <ExternalLink href="https://docs.expo.dev/develop/user-interface/color-themes/">
          <Text className="text-primary-500 font-medium">Learn more</Text>
        </ExternalLink>
      </Collapsible>

      <Collapsible title="Animations">
        <Text className="text-secondary-foreground mb-4">
          This template includes an example of an animated component. The <Text className="font-semibold text-foreground">components/HelloWave.tsx</Text> component uses the powerful{' '}
          <Text className="font-mono font-semibold text-foreground">react-native-reanimated</Text> library to create a waving hand animation.
        </Text>
        {Platform.select({
          ios: (
            <Text className="text-secondary-foreground">
              The <Text className="font-semibold text-foreground">components/ParallaxScrollView.tsx</Text> component provides a parallax effect for the header image.
            </Text>
          ),
        })}
      </Collapsible>
    </ParallaxScrollView>
  );
}
