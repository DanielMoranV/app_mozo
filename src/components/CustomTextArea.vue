<template>
    <div class="input--field">
        <p class="input--field-label box--spelling-label" :class="{ active: isActive }">
            {{ label }}
            <span v-if="obligatory" class="text--color-red">*holisiiii</span>
        </p>
        <template v-if="!hasFocus && value === ''">
            <p class="placeholder">{{ placeholder }}</p>
        </template>
        <div ref="editable" class="box--spelling spelling--input" :contentEditable="true" spellcheck="false" @focus="hasFocus = true" @blur="handleBlur" v-on="listeners">
            <template v-for="suggestion in textWithCorrections">
                {{ suggestion.suggestions === undefined ? suggestion.phrase : '' }}
                <base-suggestion-word v-if="suggestion.suggestions !== undefined" :key="suggestion.start" :suggestions="suggestion.suggestions" :word="suggestion.phrase" />
            </template>
        </div>
    </div>
</template>

<script>
import { prepareWordListWithSuggestions, removeFromListWithSuggestions } from '@/utils/parser';

export default {
    name: 'BaseInputSpelling',
    props: {
        value: {
            type: [String, Number],
            default: ''
        },
        suggestions: {
            type: [Array, Object],
            default() {
                return [];
            }
        },
        label: {
            type: String,
            default: ''
        },
        obligatory: {
            type: Boolean,
            default: false
        },
        placeholder: {
            type: String,
            default: ''
        }
    },
    data() {
        return {
            hasFocus: false,
            textWithCorrections: []
        };
    },
    computed: {
        listeners() {
            return { ...this.$listeners, input: this.onInput };
        },
        isActive() {
            return this.value === 0 || !!this.value || this.hasFocus || this.placeholder;
        },
        canEdit() {
            return !(this.disabled || this.readonly);
        }
    },
    watch: {
        suggestions(newSuggestions) {
            const element = this.$el.getElementsByClassName('spelling--input');
            element[0].textContent = '';
            this.textWithCorrections = prepareWordListWithSuggestions(this.value, newSuggestions);
        }
    },
    mounted() {
        this.$refs.editable.innerText = this.value;
        this.textWithCorrections = [];
    },
    methods: {
        onInput(e) {
            const element = e.target;
            const text = parseHtmlToText(element);
            this.$emit('input', text);
        },
        handleChangeWord({ word, suggestion }) {
            this.textWithCorrections = removeFromListWithSuggestions(this.textWithCorrections, word, suggestion);
            setTimeout(() => {
                const element = this.$el.getElementsByClassName('spelling--input');
                const text = parseHtmlToText(element[0]);
                this.$emit('input', text);
            }, 100);
        }
    }
};
</script>
