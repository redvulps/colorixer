import React, {useCallback} from "react";
import {StyleSheet, Text, TouchableOpacity} from "react-native";

import type {ColorHarmonyType} from "@/src/utils/colorUtils";

interface HarmonyOptionProps {
    harmony: { label: string; value: ColorHarmonyType };
    selected: boolean;
    onHarmonyChange: (harmony: ColorHarmonyType) => void;
}

export const HarmonyOption: React.FC<HarmonyOptionProps> = React.memo(
    ({harmony, selected, onHarmonyChange}) => {
        const handlePress = useCallback(() => {
            onHarmonyChange(harmony.value);
        }, [harmony.value, onHarmonyChange]);

        return (
            <TouchableOpacity
                style={[
                    styles.option,
                    selected && styles.selectedOption
                ]}
                onPress={handlePress}
            >
                <Text
                    style={[
                        styles.optionText,
                        selected && styles.selectedOptionText
                    ]}
                >
                    {harmony.label}
                </Text>
            </TouchableOpacity>
        );
    }
);

const styles = StyleSheet.create({
    option: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: '#f0f0f0',
        marginRight: 10,
    },
    selectedOption: {
        backgroundColor: '#2196F3',
    },
    optionText: {
        fontSize: 14,
        color: '#333',
    },
    selectedOptionText: {
        color: 'white',
    },
});
