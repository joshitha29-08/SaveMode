import { useLocalSearchParams } from 'expo-router';
import PlaceholderScreen from '../../components/PlaceholderScreen';
import { NavigationText } from '../../constants/navigation';

export default function OnboardingStep() {
  const { step } = useLocalSearchParams<{ step: string }>();

  const title = step
    ? `${NavigationText.onboarding}: ${step}`
    : NavigationText.onboarding;

  return <PlaceholderScreen title={title} />;
}