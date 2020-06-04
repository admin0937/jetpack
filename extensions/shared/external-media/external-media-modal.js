/**
 * External dependencies
 */
import { uniqBy } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { compose } from '@wordpress/compose';
import { withSelect, withDispatch } from '@wordpress/data';
import { Component } from '@wordpress/element';
import { withNotices, Modal } from '@wordpress/components';
import { UP, DOWN, LEFT, RIGHT } from '@wordpress/keycodes';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { PATH_RECENT } from './constants';
import MediaItem from './media-browser/media-item';

const MODAL_NAME = 'edit-post/external-media';

const CopyingMedia = ( { items } ) => {
	const classname =
		items.length === 1
			? 'jetpack-external-media-browser__single'
			: 'jetpack-external-media-browser';

	return (
		<div className={ classname }>
			<div className="jetpack-external-media-browser__media">
				{ items.map( item => (
					<MediaItem item={ item } key={ item.ID } isSelected isCopying />
				) ) }
			</div>
		</div>
	);
};

class ExternalMediaModal extends Component {
	constructor( props ) {
		super( props );

		this.state = {
			media: [],
			nextHandle: false,
			isLoading: false,
			isCopying: null,
			requiresAuth: false,
			path: { ID: PATH_RECENT },
		};

		this.arrowKeysPropagationStopped = false;
	}

	componentDidUpdate() {
		this.handleArrowKeysPropagation();
	}

	/**
	 * When the External Media modal is open, pressing any arrow key causes it to
	 * close immediately. This is happening because React fires blur event on the
	 * Image block re-render, which seems to be triggered only by arrow keydown
	 * event (possibly caught by the editor canvas during the re-render cycle).
	 * Right after that, it tries to restore the focus to the modal element, but
	 * because the blur has already been triggered, modal's "withFocusOutside"
	 * handler thinks that the outside of the modal was clicked so it closes it
	 * anyway. It wouldn't happen if the modal was isolated from the Image block
	 * renderer, but because of the nature of this implementation (customized
	 * media upload component) we're not really able to do that at this moment.
	 *
	 * This handler makes sure that the keydown event doesn't propagate further,
	 * which fixes the issue described above while still keeping arrow keys
	 * functional inside the modal (i.e. when navigating inside Pexels seach input
	 * text or choosing filter from one of the Google Photos filters' select
	 * dropdown).
	 */
	handleArrowKeysPropagation() {
		const eventListenerEl = document.querySelector( '.components-modal__content' );

		if ( eventListenerEl && ! this.arrowKeysPropagationStopped ) {
			eventListenerEl.addEventListener( 'keydown', () => {
				if ( [ UP, DOWN, LEFT, RIGHT ].includes( event.keyCode ) ) {
					event.stopPropagation();
				}
			} );

			this.arrowKeysPropagationStopped = true;
		}

		if ( ! eventListenerEl && this.arrowKeysPropagationStopped ) {
			this.arrowKeysPropagationStopped = false;
		}
	}

	mergeMedia( initial, media ) {
		return uniqBy( initial.concat( media ), 'ID' );
	}

	getRequestUrl( base ) {
		const { nextHandle } = this.state;

		if ( nextHandle ) {
			return base + '&page_handle=' + encodeURIComponent( nextHandle );
		}

		return base;
	}

	getMedia = ( url, resetMedia = false ) => {
		if ( this.state.isLoading ) {
			return;
		}

		if ( resetMedia ) {
			this.props.noticeOperations.removeAllNotices();
		}

		this.setState(
			{
				isLoading: true,
				media: resetMedia ? [] : this.state.media,
				nextHandle: resetMedia ? false : this.state.nextHandle,
			},
			() => this.getMediaRequest( url )
		);
	};

	handleApiError = error => {
		if ( error.code === 'authorization_required' ) {
			this.setState( { requiresAuth: true, isLoading: false, isCopying: false } );
			return;
		}

		const { noticeOperations } = this.props;

		noticeOperations.createErrorNotice(
			error.code === 'internal_server_error' ? 'Internal server error' : error.message
		);

		this.setState( { isLoading: false, isCopying: false } );
	};

	getMediaRequest = url => {
		const { nextHandle, media } = this.state;

		if ( nextHandle === false && media.length > 0 ) {
			/**
			 * Tried to make a request with no nextHandle. This can happen because
			 * InfiniteScroll sometimes triggers a request when the number of
			 * items is less than the scroll area. It should really be fixed
			 * there, but until that time...
			 */
			this.setState( {
				isLoading: false,
			} );

			return;
		}

		const path = this.getRequestUrl( url );
		const method = 'GET';

		this.setState( { requiresAuth: false } );

		apiFetch( {
			path,
			method,
			parse: window.wpcomFetch === undefined,
		} )
			.then( result => {
				this.setState( {
					media: this.mergeMedia( media, result.media ),
					nextHandle: result.meta.next_page,
					isLoading: false,
				} );
			} )
			.catch( this.handleApiError );
	};

	copyMedia = ( items, apiUrl ) => {
		this.setState( { isCopying: items } );
		this.props.noticeOperations.removeAllNotices();

		apiFetch( {
			path: apiUrl,
			method: 'POST',
			data: {
				media: items.map( item => ( {
					guid: item.guid,
					caption: item.caption,
					title: item.title,
				} ) ),
			},
		} )
			.then( result => {
				const { value, addToGallery, multiple } = this.props;
				const media = multiple ? result : result[ 0 ];

				this.props.onClose();

				// Select the image(s). This will close the modal
				this.props.onSelect( addToGallery ? value.concat( result ) : media );
			} )
			.catch( this.handleApiError );
	};

	onChangePath = ( path, cb ) => {
		this.setState( { path }, cb );
	};

	onClose = () => {
		const { closeModal, onClose } = this.props;

		if ( onClose ) {
			// onClose();
		}

		closeModal();
	};

	stopPropagation( event ) {
		event.stopPropagation();
	}

	renderContent() {
		const { media, isLoading, nextHandle, requiresAuth, path } = this.state;
		const { ExternalLibrary, noticeUI, allowedTypes, multiple = false } = this.props;

		return (
			// eslint-disable-next-line jsx-a11y/no-static-element-interactions
			<div onMouseDown={ this.stopPropagation }>
				{ noticeUI }

				<ExternalLibrary
					getMedia={ this.getMedia }
					copyMedia={ this.copyMedia }
					isLoading={ isLoading }
					media={ media }
					pageHandle={ nextHandle }
					allowedTypes={ allowedTypes }
					requiresAuth={ requiresAuth }
					multiple={ multiple }
					path={ path }
					onChangePath={ this.onChangePath }
				/>
			</div>
		);
	}

	render() {
		const { ExternalLibrary, isModalActive } = this.props;
		if ( ! ExternalLibrary || ! isModalActive ) {
			return null;
		}

		const { isCopying } = this.state;

		const classes = classnames( {
			'jetpack-external-media-browser': true,
			'jetpack-external-media-browser__is-copying': isCopying,
		} );

		return (
			<Modal
				focusOnMount={ true }
				title={ isCopying ? __( 'Copying Media', 'jetpack' ) : __( 'Select Media', 'jetpack' ) }
				className={ classes }
				onRequestClose={ this.onClose }
			>
				{ isCopying ? <CopyingMedia items={ isCopying } /> : this.renderContent() }
			</Modal>
		);
	}
}

export default compose( [
	withSelect( select => ( {
		isModalActive: select( 'core/edit-post' ).isModalActive( MODAL_NAME ),
	} ) ),
	withDispatch( dispatch => ( {
		closeModal: dispatch( 'core/edit-post' ).closeModal,
	} ) ),
	withNotices,
] )( ExternalMediaModal );
