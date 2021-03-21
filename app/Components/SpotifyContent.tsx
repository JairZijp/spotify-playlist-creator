import React, { useState, useCallback, useEffect, useContext } from "react";
import { ContentItem, remote } from "react-native-spotify-remote";
import { ActionSheet, View, Button, Text } from "native-base";
import { FlatList } from "react-native";
import SpotifyContentListItem from "./SpotifyContentListItem";
import AppContext from "../AppContext";
import { API_BASE } from 'react-native-dotenv';

const SpotifyContent: React.SFC = () => {
  const { isConnected, onError, token } = useContext(AppContext)
  const [parentItems, setParentItems] = useState<ContentItem[]>([]);
  let genres;

  // The current parent is the last parent if there are any
  const currentItem = parentItems[parentItems.length - 1];

  const back = useCallback(() => {
    if (parentItems.length === 1) {
      return;
    } else {
      const newParents = [...parentItems];
      newParents.pop();
      setParentItems(newParents);
    }
  }, [parentItems]);

  const pushParent = useCallback(async (nextParent: ContentItem) => {
    try {
      if (nextParent.container && nextParent.children == undefined || nextParent.children.length === 0) {
        const loadedChildren = await remote.getChildrenOfItem(nextParent);
        const newParent = {
          ...nextParent,
          children: loadedChildren
        }
        setParentItems([...parentItems, newParent]);
      } else {
        setParentItems([...parentItems, nextParent]);
      }
    } catch (err) {
      onError(err);
    }
  }, [parentItems])

  const fetchItems = async () => {
    try {
      let retrieved: ContentItem[] = [];
      retrieved = await remote.getRecommendedContentItems({ type: "default", flatten: false });
  
      const rootItem: ContentItem = {
        title: "",
        availableOffline: false,
        container: true,
        id: "",
        playable: false,
        subtitle: "",
        uri: "",
        children: retrieved
      }
      setParentItems([rootItem]);
    } catch (err) {
      onError(err);
    }
  };

  const fetchGenres = async () => {
    try {
      console.log('try request with access token: ', token);
      fetch(API_BASE + '/genres?' + 'token=' + token, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        }
      }).then((resp) => resp.json())
      .then(function(data) {
        genres = data.results;
        console.log("genres", data);
      });

    } catch (err) {
      onError(err);
    }
  };

  useEffect(() => {
    if (isConnected) {
      fetchItems();
      fetchGenres();
    }
  }, [isConnected]);

  return (
    <View>
      {currentItem && (
        <View style={{ display: 'flex', flexDirection: 'column' }}>
          <View style={{ borderBottomColor: "gray", borderBottomWidth: 1, height: "9%" }}>
            <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
              <Button
                disabled={parentItems.length === 1}
                bordered
                small
                style={{ margin: 5 }}
                onPress={() => back()}
              >
                <Text>Back</Text>
              </Button>
              <Text style={{ flex: 1, fontSize: 20 }}>{currentItem.title}</Text>
            </View>
          </View>
          <View style={{ height: "84%" }}>
            <FlatList
              data={currentItem.children}
              renderItem={({ item }) => <SpotifyContentListItem
                item={item}
              />}
            />
          </View>
        </View>
      )}
      <View>
        <Text>{genres}</Text>
      </View>
    </View>
  )
}


export default SpotifyContent;