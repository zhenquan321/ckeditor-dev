/**
 * @license Copyright (c) 2003-2018, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
( function() {
	'use strict';

	function getLastActiveCommands( editor, allItems ) {
		var activeItem = null;
		for ( var i in allItems ) {
			if ( editor.getCommand( allItems[ i ].command ).state === CKEDITOR.TRISTATE_ON ) {
				activeItem = allItems[ i ];
			}
		}
		return activeItem;
	}

	function createButtons( editor, definition ) {
		var allItems = definition.items,
			properties = { items: {}, buttons: {}, groups: {} },
			i,
			item,
			previousButton,
			defaultButton,
			staticFace;

		for ( i in allItems ) {
			item = allItems[ i ];

			if ( !item.group ) {
				item.group = definition.label + '_default';
			}

			if ( properties.groups[ item.group ] === undefined ) {
				properties.groups[ item.group ] = 0;
			} else {
				properties.groups[ item.group ]++;
			}
			item.order = properties.groups[ item.group ];

			if ( !item.id ) {
				item.id = item.command + item.order;
			}

			item.role = 'menuitemcheckbox';

			item.onClick = function() {
				editor.execCommand( this.command );
			};

			editor.getCommand( item.command ).on( 'state', function() {
				if ( staticFace ) {
					return;
				}
				var activeCommand = getLastActiveCommands( editor, allItems ), activeButton;
				if ( activeCommand ) {
					activeButton = properties.buttons[ activeCommand.id ];
				}

				if ( !properties.buttons[ defaultButton.id ]._.id ) {
					// Button without id isn't in DOM tree, eg. when it is in balloon toolbar which didn't show yet.
					// So don't update anything.
					return;
				}
				if ( previousButton ) {
					previousButton.hideFromToolbar();
				}

				if ( activeButton ) {
					defaultButton.hideFromToolbar();
					activeButton.showInToolbar();
					previousButton = activeButton;
				} else {
					defaultButton.showInToolbar();
					previousButton = defaultButton;
				}
			} );

			properties.items[ item.id ] = item;
			properties.buttons[ item.id ] = new CKEDITOR.ui.button( CKEDITOR.tools.extend( { label: definition.label + ' ' + item.label }, item ) );

			editor.addFeature( properties.buttons[ item.id ] );

			// First button as default. It might be overwritten by actual default button.
			if ( !defaultButton && !item[ 'default' ] ) {
				previousButton = properties.buttons[ item.id ];
				defaultButton = properties.buttons[ item.id ];
			} else {
				if ( item[ 'default' ] ) {
					if ( item[ 'default' ] === 'static' ) {
						staticFace = true;
						defaultButton && defaultButton.hideFromToolbar();
					}
					defaultButton = properties.buttons[ item.id ];
				} else {
					properties.buttons[ item.id ].hideFromToolbar();
				}
			}
		}
		return properties;
	}

	CKEDITOR.plugins.add( 'splitbutton', {
		requires: 'menubutton',

		beforeInit: function( editor ) {
			/**
			 * @class
			 * @extends CKEDITOR.ui.menuButton
			 */
			CKEDITOR.ui.splitButton = CKEDITOR.tools.createClass( {
				base: CKEDITOR.ui.menuButton,

				/**
				 * Creates a splitButton class instance.
				 *
				 * @since 4.10.0
				 * @constructor
				 * @param {Object} definition The splitButton definition.
				 */
				$: function( definition ) {
					var properties = createButtons( editor, definition, this );

					if ( !definition.onMenu ) {
						definition.onMenu = function() {
							var activeItems = {};
							for ( var i in properties.items ) {
								activeItems[ i ] = ( editor.getCommand( properties.items[ i ].command ).state === CKEDITOR.TRISTATE_ON ) ? CKEDITOR.TRISTATE_ON : CKEDITOR.TRISTATE_OFF;
							}
							return activeItems;
						};
					}

					this.base( definition );
					this.icon = false;

					this.items = properties.items;
					this.buttons = properties.buttons;

					this.offsetParent = function() {
						return this.rendered && this.rendered[ 0 ] && CKEDITOR.document.getById( this.rendered[ 0 ].id ).getParent();
					};

					definition.toolbar += 1;
					var counter = 0;
					for ( var j in properties.groups ) {
						editor.addMenuGroup( j, counter++ );
					}

					editor.addMenuItems( this.items );
				},

				statics: {
					handler: {
						create: function( definition ) {
							return new CKEDITOR.ui.splitButton( definition, definition.items );
						}
					}
				}
			} );

			/**
			 * Renders the splitButton.
			 *
			 * @param {CKEDITOR.editor} editor The editor instance which this button is
			 * to be used by.
			 * @param {Array} output The output array to which the HTML code related to
			 * this button should be appended.
			 */
			CKEDITOR.ui.splitButton.prototype.render = function( editor, output ) {
				output.push( '<span class="cke_splitbutton">' );
				this.rendered = [];
				for ( var key in this.buttons ) {
					this.rendered.push( this.buttons[ key ].render( editor, output ) );
				}

				var splitButton = CKEDITOR.ui.button.prototype.render.call( this, editor, output );
				output.push( '</span>' );
				return splitButton;
			};
			editor.ui.addHandler( CKEDITOR.UI_SPLITBUTTON, CKEDITOR.ui.splitButton.handler );
		}
	} );

	/**
	 * Split Button UI element.
	 *
	 * @readonly
	 * @property {String} [='splitbutton']
	 * @member CKEDITOR
	 */

	CKEDITOR.UI_SPLITBUTTON = 'splitbutton';

} )();