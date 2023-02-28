import React, { useState, useEffect } from 'react';
import {
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

  const [allEntries, setAllEntries] = useState([]);

  const getAllEntries = async () => {
    try {
      const response = await cma.entry.getMany({
        query: {
          content_type: contentType,
          limit: 100,
          include: 1,
        },
      });

      setAllEntries(response.items);
    } catch {
      // Do nothing
    }
  };

  useEffect(() => {
    getAllEntries();
  }, []);

  return [allEntries, getAllEntries];
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

    const tag = tags.find(tag => tag.sys.id === tagEntryId);
    if (tag) {
      setSelectedTag(tag);
    } else {
      setSelectedTag(EMPTY_ENTRY);
    }
  };

  // ===== STEP 2: Variant selection =====
  const [phoneVariants, refetchPhoneVariants] = useAllEntries('phoneVariant');
  const [partialVariantName, setPartialVariantName] = useState('');

  const matchingPhoneVariants = phoneVariants.filter(variant => {
    const tags = getFieldValue(variant, 'tags') || [];
    const doesNotHaveTag = !tags.some(tag => tag.sys.id === selectedTag.sys.id);

    const isPartialNameMatch =
      !partialVariantName ||
      getFieldValue(variant, 'entryTitle')
        .toLowerCase()
        .includes(partialVariantName);

    return doesNotHaveTag && isPartialNameMatch;
  });

  // ===== STEP 3: Contentful updates =====
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      const clonedVariants = cloneDeep(matchingPhoneVariants);

      const variantsWithNewTag = clonedVariants.map(variant => {
        const oldTags = getFieldValue(variant, 'tags') || [];
        const newTagLink = {
          sys: { type: 'Link', linkType: 'Entry', id: selectedTag.sys.id },
        };

        if (variant.fields.tags) {
          variant.fields.tags[LOCALE] = [...oldTags, newTagLink];
        } else {
          variant.fields.tags = { [LOCALE]: [...oldTags, newTagLink] };
        }

        return variant;
      });

      for (let variant of variantsWithNewTag) {
        await cma.entry.update({ entryId: variant.sys.id }, variant);
        await Notification.info(
          `"${getFieldValue(selectedTag, 'tag')}" tag added to ${getFieldValue(
            variant,
            'entryTitle',
          )}`,
        );
      }

      await Notification.success('All updates successful!');
    } catch {
      await Notification.error('Uh oh something went wrong');
    } finally {
      // Reset all state
      setIsSubmitting(false);
      setSelectedTag(EMPTY_ENTRY);
      setPartialVariantName('');
      await refetchPhoneVariants();
    }
  };

  return (
    <Box
      style={{ maxWidth: '800px', marginLeft: 'auto', marginRight: 'auto' }}
      marginTop='spacing2Xl'
      marginBottom='spacing2Xl'
    >
      {tags.length > 0 && (
        <FormControl>
          <FormControl.Label>Select tag</FormControl.Label>
          <Select
            id='tagSelect'
            name='tagSelect'
            value={selectedTag.sys.id}
            onChange={handleTagSelect}
          >
            <Select.Option value=''>Click to expand</Select.Option>
            {tags.map(tag => (
              <Select.Option key={tag.sys.id} value={tag.sys.id}>
                {getFieldValue(tag, 'tag')}
              </Select.Option>
            ))}
          </Select>
        </FormControl>
      )}

      {selectedTag.fields && (
        <>
          <Box marginTop='spacing4Xl' marginBottom='spacing2Xl'>
            <FormControl marginTop='spacing4Xl'>
              <FormControl.Label>Target variants to add tag</FormControl.Label>
              <TextInput
                type='text'
                name='partialVariantName'
                placeholder='Search by partial name'
                value={partialVariantName}
                onChange={e => setPartialVariantName(e.target.value)}
              />
            </FormControl>
            {matchingPhoneVariants.length > 0 && (
              <Grid columns='1fr 1fr' rowGap='spacingM' columnGap='spacingM'>
                {matchingPhoneVariants.map(variant => (
                  <Grid.Item key={variant.sys.id}>
                    <EntryCard
                      status='published'
                      contentType='Phone Variant'
                      title={getFieldValue(variant, 'entryTitle')}
                    ></EntryCard>
                  </Grid.Item>
                ))}
              </Grid>
            )}
          </Box>

          <Button
            variant='primary'
            isLoading={isSubmitting}
            isDisabled={isSubmitting}
            onClick={handleSubmit}
          >
            Add tag to variants
          </Button>
        </>
      )}
    </Box>
  );
};

export default Page;
