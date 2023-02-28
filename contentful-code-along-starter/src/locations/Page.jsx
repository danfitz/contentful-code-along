import React, { useState, useEffect } from 'react';
import {
  Paragraph,
  Box,
  FormControl,
  Select,
  TextInput,
  Grid,
  EntryCard,
  Button,
  Notification,
} from '@contentful/f36-components';
import { useCMA, useSDK } from '@contentful/react-apps-toolkit';
import cloneDeep from 'lodash.clonedeep';

const useAllEntries = contentType => {
  const cma = useCMA();

  // TODO: Add API call to fetch entries for given contentType

  return [];
};

const Page = () => {
  const cma = useCMA();
  const sdk = useSDK();

  const EMPTY_ENTRY = { sys: { id: '' } };
  const LOCALE = sdk.locales.default;
  const getFieldValue = (entry, fieldId) => entry.fields[fieldId]?.[LOCALE];

  // ===== STEP 1: Tag selection =====
  const [tags] = useAllEntries('tag');
  const [selectedTag, setSelectedTag] = useState(EMPTY_ENTRY);

  const handleTagSelect = e => {
    const tagEntryId = e.target.value;

    // TODO: Set selected tag by finding it in the tags array
  };

  // ===== STEP 2: Variant selection =====
  const [phoneVariants, refetchPhoneVariants] = useAllEntries('phoneVariant');
  const [partialVariantName, setPartialVariantName] = useState('');

  // TODO: Filter for variants that (1) don't already have tag or (2) don't match partial text search
  const matchingPhoneVariants = [];

  // ===== STEP 3: Contentful updates =====
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      // TODO: (1) Link tag to each phone variant and (2) send update to Contentful
    } catch {
      // TODO: (2) Display error message in case of failure
    } finally {
      // Reset all state
      setIsSubmitting(false);
      setSelectedTag(EMPTY_ENTRY);
      setPartialVariantName('');
    }
  };

  return <Paragraph>Hello Page Component (AppId: {sdk.ids.app})</Paragraph>;
};

export default Page;
